from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User

from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.application import Application
from app.models.infrastructure import Environment, Service
from app.models.audit import AuditAction
from app.core.audit import log_activity
from app.schemas.settings import (
    ApplicationCreate, ApplicationOut, ApplicationUpdate, 
    EnvironmentOut, EnvironmentCreate, EnvironmentUpdate,
    ServiceCreate, ServiceOut, ServiceUpdate
)

router = APIRouter(prefix="/applications", tags=["Applications"])

# ── Applications ─────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ApplicationOut])
def get_applications(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Return a list of applications with nested environments and services"""
    return db.query(Application).options(
        joinedload(Application.environments).joinedload(Environment.services)
    ).all()

@router.post("/", response_model=ApplicationOut)
def create_application(
    payload: ApplicationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.app.manage"))
):
    app = Application(**payload.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "Application", str(app.itam_id), f"Created application: {app.name}")
    return app

@router.put("/{itam_id}", response_model=ApplicationOut)
def update_application(
    itam_id: int, 
    payload: ApplicationUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.app.manage"))
):
    app = db.query(Application).filter(Application.itam_id == itam_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)
    
    db.commit()
    db.refresh(app)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "Application", str(app.itam_id), f"Updated application details for: {app.name}")
    return app

@router.delete("/{itam_id}")
def delete_application(
    itam_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.app.manage"))
):
    app = db.query(Application).filter(Application.itam_id == itam_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app_name = app.name
    db.delete(app)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "Application", str(itam_id), f"Deleted application: {app_name}")
    return {"status": "success"}

# ── Environments ─────────────────────────────────────────────────────────────

@router.get("/{itam_id}/environments/{env_id}", response_model=Dict)
def get_environment_details(itam_id: str, env_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    # Convert to int for query if needed, but match as str in path
    itam_int = int(itam_id)
    env = db.query(Environment).filter(Environment.itam_id == itam_int, Environment.env_id == env_id).first()
    if not env:
         raise HTTPException(status_code=404, detail="Environment not found")
    
    # Inject related servers
    from app.models.infrastructure import Server
    app_servers = db.query(Server).filter(Server.itam_id == itam_id).all()
    infra_servers = []
    
    for s in app_servers:
        if env_id in s.environments:
            infra_servers.append({
                "hostname": s.hostname,
                "status": s.status,
                "ip_address": s.ip_address,
                "role": s.role or "Compute",
                "cpu_usage": "35%",  
                "mem_usage": "51%"
            })
            
    return {
        "itam_id": env.itam_id,
        "env_id": env.env_id,
        "name": env.name,
        "app_name": env.application.name if env.application else "Unknown",
        "status": env.status,
        "infra_servers": infra_servers,
        "services": [
            {"name": svc.name, "description": svc.description, "status": svc.status} for svc in env.services
        ]
    }

@router.put("/{itam_id}/environments/{env_id}", response_model=EnvironmentOut)
def update_environment(
    itam_id: str, 
    env_id: str, 
    payload: EnvironmentUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.env.manage"))
):
    itam_int = int(itam_id)
    env = db.query(Environment).filter(Environment.itam_id == itam_int, Environment.env_id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(env, key, value)
    
    db.commit()
    db.refresh(env)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "Environment", f"{itam_id}:{env_id}", f"Updated environment {env_id} for app {itam_id}")
    return env

@router.delete("/{itam_id}/environments/{env_id}")
def delete_environment(
    itam_id: str, 
    env_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.env.manage"))
):
    itam_int = int(itam_id)
    env = db.query(Environment).filter(Environment.itam_id == itam_int, Environment.env_id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(env)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "Environment", f"{itam_id}:{env_id}", f"Deleted environment {env_id} from app {itam_id}")
    return {"status": "success"}

@router.get("/environments", response_model=List[EnvironmentOut])
def list_all_environments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Environment).all()

@router.post("/environments", response_model=EnvironmentOut)
def create_environment(
    payload: EnvironmentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.env.manage"))
):
    env = Environment(**payload.model_dump())
    db.add(env)
    db.commit()
    db.refresh(env)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "Environment", f"{env.itam_id}:{env.env_id}", f"Created environment {env.env_id} for app {env.itam_id}")
    return env

# ── Generic Services ─────────────────────────────────────────────────────────

@router.get("/services", response_model=List[ServiceOut])
def list_all_services(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Service).all()

@router.post("/services", response_model=ServiceOut)
def create_service(
    payload: ServiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.service.manage"))
):
    svc = Service(**payload.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "Service", f"{svc.itam_id}:{svc.env_id}:{svc.name}", f"Registered service {svc.name} in {svc.env_id}")
    return svc

@router.delete("/{itam_id}/{env_id}/{name}")
def delete_service(
    itam_id: int, 
    env_id: str, 
    name: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.service.manage"))
):
    svc = db.query(Service).filter(
        Service.itam_id == itam_id, 
        Service.env_id == env_id, 
        Service.name == name
    ).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "Service", f"{itam_id}:{env_id}:{name}", f"Deleted service {name} from {env_id}")
    return {"status": "success"}

@router.put("/{itam_id}/{env_id}/{name}", response_model=ServiceOut)
def update_service(
    itam_id: int, 
    env_id: str, 
    name: str, 
    payload: ServiceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.service.manage"))
):
    svc = db.query(Service).filter(
        Service.itam_id == itam_id, 
        Service.env_id == env_id, 
        Service.name == name
    ).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(svc, key, value)
    
    db.commit()
    db.refresh(svc)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "Service", f"{itam_id}:{env_id}:{name}", f"Updated service {name} in {env_id}")
    return svc
