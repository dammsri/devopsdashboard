from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.ske import SKEEnvironment, SKEService
from app.models.audit import AuditAction
from app.core.audit import log_activity
from app.schemas.settings import SKEEnvironmentOut, SKEEnvironmentCreate, SKEEnvironmentUpdate, SKEServiceOut, SKEServiceCreate, SKEServiceUpdate

router = APIRouter(prefix="/skeenvironments", tags=["SKE Environments"])

@router.put("/{ske_env_id}", response_model=SKEEnvironmentOut)
def update_environment(
    ske_env_id: str, 
    payload: SKEEnvironmentUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    env = db.query(SKEEnvironment).filter(SKEEnvironment.ske_env_id == ske_env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(env, key, value)
    db.commit()
    db.refresh(env)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "SKEEnvironment", env.ske_env_id, f"Updated configurations for SKE environment: {env.name}")
    return env

@router.delete("/{ske_env_id}")
def delete_environment(
    ske_env_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    env = db.query(SKEEnvironment).filter(SKEEnvironment.ske_env_id == ske_env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    env_name = env.name
    db.delete(env)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "SKEEnvironment", ske_env_id, f"Deleted SKE environment: {env_name}")
    return {"status": "success"}

@router.get("/", response_model=List[SKEEnvironmentOut])
def get_environments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKEEnvironment).all()

@router.post("/", response_model=SKEEnvironmentOut)
def create_environment(
    payload: SKEEnvironmentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    env = SKEEnvironment(**payload.model_dump())
    db.add(env)
    db.commit()
    db.refresh(env)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "SKEEnvironment", env.ske_env_id, f"Created SKE environment: {env.name}")
    return env

# ── Services ─────────────────────────────────────────────────────────────

@router.delete("/{ske_env_id}/services/{service_id}")
def delete_service(
    ske_env_id: str, 
    service_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.service.manage"))
):
    svc = db.query(SKEService).filter(SKEService.ske_env_id == ske_env_id, SKEService.service_id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc_name = svc.name
    db.delete(svc)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "SKEService", f"{ske_env_id}:{service_id}", f"Deleted SKE service {svc_name}")
    return {"status": "success"}

@router.put("/{ske_env_id}/services/{service_id}", response_model=SKEServiceOut)
def update_service(
    ske_env_id: str, 
    service_id: str, 
    payload: SKEServiceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.service.manage"))
):
    svc = db.query(SKEService).filter(SKEService.ske_env_id == ske_env_id, SKEService.service_id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(svc, key, value)
    
    db.commit()
    db.refresh(svc)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "SKEService", f"{ske_env_id}:{service_id}", f"Updated configurations for SKE service {svc.name}")
    return svc

@router.get("/{ske_env_id}/services/{service_id}")
def get_service_detail(ske_env_id: str, service_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    svc = db.query(SKEService).filter(SKEService.ske_env_id == ske_env_id, SKEService.service_id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    # Generate pod metrics for visual consistency
    pods = [
        {
            "name": f"{service_id}-pod-{i}",
            "status": svc.status if i < 3 else "running",
            "ready": True,
            "restarts": 0,
            "age": f"{14 - i}d",
            "node": f"{ske_env_id}-node-{(i % 3) + 1}",
        }
        for i in range(1, svc.replicas + 1)
    ]

    return {
        "id": svc.service_id,
        "ske_env_id": ske_env_id,
        "name": svc.name,
        "status": svc.status.capitalize(),
        "uptime": "14d 6h 22m",
        "replicas": {"desired": svc.replicas, "current": svc.replicas, "ready": svc.replicas},
        "resources": {"cpu": "250m", "memory": "512Mi"},
        "namespace": "default",
        "image": f"sc-registry.io/devops/{svc.service_id}:{svc.version or 'latest'}",
        "pods": pods[:5], # Cap at 5 for display
    }

@router.get("/services", response_model=List[SKEServiceOut])
def list_all_services(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKEService).all()

@router.get("/{ske_env_id}/services", response_model=List[SKEServiceOut])
def get_environment_services(ske_env_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKEService).filter(SKEService.ske_env_id == ske_env_id).all()

@router.post("/{ske_env_id}/services", response_model=SKEServiceOut)
def create_service(
    ske_env_id: str,
    payload: SKEServiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.service.manage"))
):
    # Ensure payload ske_env_id matches path if both provided
    data = payload.model_dump()
    data['ske_env_id'] = ske_env_id
    svc = SKEService(**data)
    db.add(svc)
    db.commit()
    db.refresh(svc)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "SKEService", f"{svc.ske_env_id}:{svc.service_id}", f"Deployed SKE service {svc.name} in environment {ske_env_id}")
    return svc
