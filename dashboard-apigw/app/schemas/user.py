from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ── Auth Schemas ──────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    user_id: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── FAP Schemas ───────────────────────────────────────────────────────────────
class FunctionalityOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    ad_group_mapping: Optional[str] = None
    functionalities: List[FunctionalityOut] = []

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    ad_group_mapping: Optional[str] = None
    functionality_ids: List[int] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    ad_group_mapping: Optional[str] = None
    functionality_ids: Optional[List[int]] = None


class FunctionalityUpdate(BaseModel):
    description: str


# ── User Schemas ──────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    user_id: str
    email: EmailStr
    first_name: str
    last_name: str
    auth_source: str = "local"
    is_external: bool = False


class UserCreate(UserBase):
    password: str
    role_ids: List[int] = []


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    role_ids: Optional[List[int]] = None


class UserOut(UserBase):
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    roles: List[RoleOut] = []

    class Config:
        from_attributes = True
