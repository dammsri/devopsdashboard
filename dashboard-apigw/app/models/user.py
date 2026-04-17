import enum
from datetime import datetime, timezone
from typing import List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Table, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.session import Base


# Association Table: User <-> Role
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

# Association Table: Role <-> Functionality
role_functionalities = Table(
    "role_functionalities",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("functionality_id", Integer, ForeignKey("functionalities.id", ondelete="CASCADE"), primary_key=True),
)


class Functionality(Base):
    __tablename__ = "functionalities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g. "infra.server.delete"
    description = Column(String, nullable=True)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    ad_group_mapping = Column(String, nullable=True) # Mapping to AD Group CN or DN

    functionalities = relationship("Functionality", secondary=role_functionalities, backref="roles")


class AuthSource(str, enum.Enum):
    local = "local"
    ad = "ad"


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for AD users
    
    auth_source = Column(SAEnum(AuthSource), default=AuthSource.local, nullable=False)
    is_external = Column(Boolean, default=False) # True if from AD
    is_active = Column(Boolean, default=True)
    
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    roles = relationship("Role", secondary=user_roles, backref="users")
