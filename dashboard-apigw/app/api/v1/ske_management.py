from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.ske import SKECluster, SKENamespace, SKEEnvironment, SKEService
from app.models.audit import AuditAction
from app.core.audit import log_activity
from app.schemas.settings import (
    SKEClusterOut, SKEClusterCreate, SKEClusterUpdate,
    SKENamespaceOut, SKENamespaceCreate, SKENamespaceUpdate,
    SKEEnvironmentOut, SKEEnvironmentCreate, SKEEnvironmentUpdate,
    SKEServiceOut, SKEServiceCreate, SKEServiceUpdate
)
from app.core.encryption import encrypt_password

router = APIRouter(prefix="/ske", tags=["SKE Management"])

# ── Clusters ──────────────────────────────────────────────────────────────────

@router.get("/clusters", response_model=List[SKEClusterOut])
def list_clusters(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKECluster).all()

@router.post("/clusters", response_model=SKEClusterOut)
def create_cluster(
    payload: SKEClusterCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    data = payload.model_dump()
    if data.get("password"):
        data["password"] = encrypt_password(data["password"])
    
    cluster = SKECluster(**data)
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "SKECluster", f"{cluster.itam_id}:{cluster.cluster_id}", f"Created SKE cluster: {cluster.cluster_id}")
    return cluster

@router.put("/clusters/{itam_id}/{cluster_id}", response_model=SKEClusterOut)
def update_cluster(
    itam_id: int,
    cluster_id: str,
    payload: SKEClusterUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    cluster = db.query(SKECluster).filter(SKECluster.itam_id == itam_id, SKECluster.cluster_id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password"] = encrypt_password(update_data["password"])
    elif "password" in update_data:
        del update_data["password"] # Don't overwrite with empty string
        
    for key, value in update_data.items():
        setattr(cluster, key, value)
        
    db.commit()
    db.refresh(cluster)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "SKECluster", f"{itam_id}:{cluster_id}", f"Updated SKE cluster configurations for: {cluster_id}")
    return cluster

@router.delete("/clusters/{itam_id}/{cluster_id}")
def delete_cluster(
    itam_id: int,
    cluster_id: str,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    cluster = db.query(SKECluster).filter(SKECluster.itam_id == itam_id, SKECluster.cluster_id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    db.delete(cluster)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "SKECluster", f"{itam_id}:{cluster_id}", f"Deleted SKE cluster: {cluster_id}")
    return {"status": "success"}

# ── Namespaces ────────────────────────────────────────────────────────────────

@router.get("/namespaces", response_model=List[SKENamespaceOut])
def list_namespaces(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKENamespace).all()

@router.post("/namespaces", response_model=SKENamespaceOut)
def create_namespace(
    payload: SKENamespaceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    ns = SKENamespace(**payload.model_dump())
    db.add(ns)
    db.commit()
    db.refresh(ns)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "SKENamespace", f"{ns.itam_id}:{ns.namespace}", f"Registered SKE namespace: {ns.namespace}")
    return ns

@router.put("/namespaces/{itam_id}/{cluster_id}/{ske_env_id}/{namespace}", response_model=SKENamespaceOut)
def update_namespace(
    itam_id: int,
    cluster_id: str,
    ske_env_id: str,
    namespace: str,
    payload: SKENamespaceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    ns = db.query(SKENamespace).filter(
        SKENamespace.itam_id == itam_id,
        SKENamespace.cluster_id == cluster_id,
        SKENamespace.ske_env_id == ske_env_id,
        SKENamespace.namespace == namespace
    ).first()
    if not ns:
        raise HTTPException(status_code=404, detail="Namespace not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ns, key, value)
        
    db.commit()
    db.refresh(ns)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "SKENamespace", f"{itam_id}:{cluster_id}:{ske_env_id}:{namespace}", f"Updated SKE namespace details for: {namespace}")
    return ns

@router.delete("/namespaces/{itam_id}/{cluster_id}/{ske_env_id}/{namespace}")
def delete_namespace(
    itam_id: int,
    cluster_id: str,
    ske_env_id: str,
    namespace: str,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    ns = db.query(SKENamespace).filter(
        SKENamespace.itam_id == itam_id,
        SKENamespace.cluster_id == cluster_id,
        SKENamespace.ske_env_id == ske_env_id,
        SKENamespace.namespace == namespace
    ).first()
    if not ns:
        raise HTTPException(status_code=404, detail="Namespace not found")
    db.delete(ns)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "SKENamespace", f"{itam_id}:{cluster_id}:{ske_env_id}:{namespace}", f"Deleted SKE namespace: {namespace}")
    return {"status": "success"}

# ── Environments ─────────────────────────────────────────────────────────────

@router.get("/environments", response_model=List[SKEEnvironmentOut])
def list_environments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKEEnvironment).all()

@router.post("/environments", response_model=SKEEnvironmentOut)
def create_environment(
    payload: SKEEnvironmentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    env = SKEEnvironment(**payload.model_dump())
    db.add(env)
    db.commit()
    db.refresh(env)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "SKEEnvironment", f"{env.cluster_id}:{env.ske_env_id}", f"Created SKE environment: {env.name}")
    return env

@router.put("/environments/{itam_id}/{cluster_id}/{ske_env_id}", response_model=SKEEnvironmentOut)
def update_environment(
    itam_id: int,
    cluster_id: str,
    ske_env_id: str,
    payload: SKEEnvironmentUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    env = db.query(SKEEnvironment).filter(
        SKEEnvironment.itam_id == itam_id,
        SKEEnvironment.cluster_id == cluster_id,
        SKEEnvironment.ske_env_id == ske_env_id
    ).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(env, key, value)
        
    db.commit()
    db.refresh(env)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "SKEEnvironment", f"{cluster_id}:{ske_env_id}", f"Updated SKE environment: {env.name}")
    return env

@router.delete("/environments/{itam_id}/{cluster_id}/{ske_env_id}")
def delete_environment(
    itam_id: int,
    cluster_id: str,
    ske_env_id: str,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.cluster.manage"))
):
    env = db.query(SKEEnvironment).filter(
        SKEEnvironment.itam_id == itam_id,
        SKEEnvironment.cluster_id == cluster_id,
        SKEEnvironment.ske_env_id == ske_env_id
    ).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(env)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "SKEEnvironment", f"{cluster_id}:{ske_env_id}", f"Deleted SKE environment: {env.name}")
    return {"status": "success"}

@router.get("/environments/{ske_env_id}/services", response_model=List[SKEServiceOut])
def get_environment_services(ske_env_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Returns all services belonging to a specific SKE environment."""
    return db.query(SKEService).filter(SKEService.ske_env_id == ske_env_id).all()

# ── Services ─────────────────────────────────────────────────────────────────

@router.get("/services", response_model=List[SKEServiceOut])
def list_services(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SKEService).all()

@router.post("/services", response_model=SKEServiceOut)
def create_service(
    payload: SKEServiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.service.manage"))
):
    svc = SKEService(**payload.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "SKEService", f"{svc.ske_env_id}:{svc.service_id}", f"Deployed SKE service: {svc.name}")
    return svc

@router.delete("/services/{itam_id}/{cluster_id}/{ske_env_id}/{namespace}/{service_id}")
def delete_service(
    itam_id: int,
    cluster_id: str,
    ske_env_id: str,
    namespace: str,
    service_id: str,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("ske.service.manage"))
):
    svc = db.query(SKEService).filter(
        SKEService.itam_id == itam_id,
        SKEService.cluster_id == cluster_id,
        SKEService.ske_env_id == ske_env_id,
        SKEService.namespace == namespace,
        SKEService.service_id == service_id
    ).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(svc)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "SKEService", f"{itam_id}:{cluster_id}:{ske_env_id}:{namespace}:{service_id}", f"Deleted SKE service: {svc.name}")
    return {"status": "success"}

@router.put("/services/{itam_id}/{cluster_id}/{ske_env_id}/{namespace}/{service_id}", response_model=SKEServiceOut)
def update_service(
    itam_id: int,
    cluster_id: str,
    ske_env_id: str,
    namespace: str,
    service_id: str,
    payload: SKEServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ske.service.manage"))
):
    svc = db.query(SKEService).filter(
        SKEService.itam_id == itam_id,
        SKEService.cluster_id == cluster_id,
        SKEService.ske_env_id == ske_env_id,
        SKEService.namespace == namespace,
        SKEService.service_id == service_id
    ).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(svc, key, value)
        
    db.commit()
    db.refresh(svc)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "SKEService", f"{itam_id}:{cluster_id}:{ske_env_id}:{namespace}:{service_id}", f"Updated SKE service: {svc.name}")
    return svc

@router.get("/services/{ske_env_id}/{service_id}", response_model=SKEServiceOut)
def get_service_detail(ske_env_id: str, service_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Returns details for a specific SKE service."""
    svc = db.query(SKEService).filter(SKEService.ske_env_id == ske_env_id, SKEService.service_id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="SKE Service not found")
    return svc
