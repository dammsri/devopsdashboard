from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Set
from app.core.dependencies import get_current_user, require_permission
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User, Role
from app.models.audit import AuditAction
from app.core.audit import log_activity
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

def has_admin_privilege(user: User) -> bool:
    """Helper to check if user has system management permissions."""
    perms: Set[str] = set()
    for role in user.roles:
        for func in role.functionalities:
            perms.add(func.name)
    return "sys.security.manage" in perms

@router.get("/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("sys.security.manage")),
):
    return db.query(User).all()


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sys.security.manage")),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        user_id=payload.user_id,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        hashed_password=get_password_hash(payload.password),
    )
    
    if payload.role_ids:
        roles = db.query(Role).filter(Role.id.in_(payload.role_ids)).all()
        user.roles = roles
        
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "User", user.user_id, f"Registered new user account: {user.first_name} {user.last_name}")
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Users can view their own profile; admins can view any
    is_admin = has_admin_privilege(current_user)
    if not is_admin and current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = has_admin_privilege(current_user)
    if not is_admin and current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    
    if payload.is_active is not None and is_admin:
        user.is_active = payload.is_active
        
    if payload.password is not None:
        user.hashed_password = get_password_hash(payload.password)

    if payload.role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(payload.role_ids)).all()
        user.roles = roles

    db.commit()
    db.refresh(user)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "User", user_id, f"Updated user profile for: {user.first_name} {user.last_name}")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("sys.security.manage")),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    full_name = f"{user.first_name} {user.last_name}"
    db.delete(user)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "User", user_id, f"Deleted user account: {full_name}")
