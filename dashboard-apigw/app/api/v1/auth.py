from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie
from sqlalchemy.orm import Session
from typing import Optional, List, Set
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User, AuthSource
from app.schemas.user import LoginRequest, TokenResponse, RefreshRequest, UserOut
from app.core.ad_service import ad_service
from app.core.auth_utils import jit_provision_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_flattened_permissions(user: User) -> List[str]:
    """Helper to get all distinct functionality names for a user."""
    permissions: Set[str] = set()
    for role in user.roles:
        for func in role.functionalities:
            permissions.add(func.name)
    return list(permissions)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = None
    
    if settings.AUTH_MODE == "ACTIVE_DIRECTORY":
        # 1. Attempt AD Authentication
        if ad_service.authenticate(payload.user_id, payload.password):
            # 2. Fetch User metadata from AD
            full_name, email, groups = ad_service.get_user_info(payload.user_id)
            # 3. JIT Provision / Sync
            user = jit_provision_user(db, payload.user_id, full_name, email, groups)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Credentials (AD Auth failed)",
            )
    else:
        # Standard Local Authentication
        user = db.query(User).filter(User.user_id == payload.user_id).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID or password",
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Create claims for token
    permissions = get_flattened_permissions(user)
    extra = {
        "permissions": permissions, 
        "name": f"{user.first_name} {user.last_name}",
        "is_external": user.is_external
    }
    
    access_token = create_access_token(user.user_id, extra)
    refresh_token = create_refresh_token(user.user_id, extra)

    # Set refresh token as httpOnly cookie for security
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=7 * 24 * 3600,
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    response: Response,
    payload: Optional[RefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db),
):
    token = (payload.refresh_token if payload else None) or refresh_token_cookie
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")

    data = decode_token(token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = data.get("sub")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    permissions = get_flattened_permissions(user)
    extra = {
        "permissions": permissions, 
        "name": f"{user.first_name} {user.last_name}",
        "is_external": user.is_external
    }
    
    new_access = create_access_token(user.user_id, extra)
    new_refresh = create_refresh_token(user.user_id, extra)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        samesite="strict",
        max_age=7 * 24 * 3600,
    )
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout")
def logout(response: Response, _: User = Depends(get_current_user)):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
