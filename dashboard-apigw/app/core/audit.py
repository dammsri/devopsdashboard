from sqlalchemy.orm import Session
from app.models.audit import AuditLog, AuditAction
from typing import Optional, Any

def log_activity(
    db: Session,
    user_id: Optional[str],
    action: AuditAction,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[Any] = None,
    status: str = "success",
):
    """
    Utility to record an action in the audit log.
    Captures user, action, type, and optional metadata for high-fidelity tracking.
    """
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        detail=detail,
        ip_address=ip_address,
        metadata_json=metadata,
        status=status,
    )
    db.add(audit_log)
    try:
        db.commit()
    except Exception:
        db.rollback()
        # Fallback to console logging if DB audit fails to prevent blocking the main action
        import logging
        logging.error(f"Failed to write audit log: {user_id} {action} {resource_type}")
