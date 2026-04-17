from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.db.session import Base


class AIAuditLog(Base):
    __tablename__ = "ai_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True)
    action = Column(String, nullable=False) # e.g. "RESTART_SERVER"
    rationale = Column(String, nullable=True) # AI's explanation for the action
    payload = Column(JSON, nullable=True) # The specific data sent to the tool
    status = Column(String, default="success") # success, failed
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
