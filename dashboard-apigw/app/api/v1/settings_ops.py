from fastapi import APIRouter, Depends
from typing import List
from app.core.telemetry_engine import get_job_status
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/settings/ops", tags=["Operations"])

@router.get("/jobs", response_model=List[dict])
def list_background_jobs(_: User = Depends(get_current_user)):
    """
    Returns a list of all background telemetry jobs and their status.
    Requires authentication.
    """
    return get_job_status()
