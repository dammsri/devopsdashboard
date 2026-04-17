import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum as SAEnum
from app.db.session import Base


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    IMPORT = "IMPORT"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True) # Can be null for system actions or failed logins
    action = Column(SAEnum(AuditAction), nullable=False)
    resource_type = Column(String, index=True, nullable=True) # e.g. "Application", "Server"
    resource_id = Column(String, index=True, nullable=True) # itam_id, etc.
    detail = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True) # JSON store for payloads/context
    status = Column(String, default="success") # success, failed
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
