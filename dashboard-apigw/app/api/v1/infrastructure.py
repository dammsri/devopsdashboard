from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.infrastructure import Server, Environment
from app.models.audit import AuditAction
from app.core.audit import log_activity
from app.schemas.settings import ServerOut, ServerCreate, ServerUpdate
from app.core.encryption import encrypt_password

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])

@router.get("/servers", response_model=List[ServerOut])
def list_servers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Server).all()

@router.post("/servers", response_model=ServerOut)
def create_server(
    payload: ServerCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.server.create"))
):
    # Encrypt password before saving
    server_data = payload.model_dump(exclude={"environments"})
    server_data["password"] = encrypt_password(server_data["password"])
    
    server = Server(**server_data)
    
    # Handle M2M environments
    if payload.environments:
        envs = db.query(Environment).filter(
            Environment.itam_id == payload.itam_id,
            Environment.env_id.in_(payload.environments)
        ).all()
        server.environments = envs
        
    db.add(server)
    db.commit()
    db.refresh(server)
    log_activity(db, current_user.user_id, AuditAction.CREATE, "Server", f"{server.ip_address}:{server.username}", f"Registered server: {server.hostname} ({server.ip_address})")
    return server

@router.put("/servers/{itam_id}/{ip_address}/{username}", response_model=ServerOut)
def update_server(
    itam_id: str,
    ip_address: str,
    username: str, 
    payload: ServerUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.server.update"))
):
    itam_int = int(itam_id)
    server = db.query(Server).filter(
        Server.itam_id == itam_int,
        Server.ip_address == ip_address,
        Server.username == username
    ).first()
    
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    update_data = payload.model_dump(exclude_unset=True, exclude={"environments"})
    if "password" in update_data:
        update_data["password"] = encrypt_password(update_data["password"])
        
    for key, value in update_data.items():
        setattr(server, key, value)
        
    # Handle M2M environments update
    if payload.environments is not None:
        envs = db.query(Environment).filter(
            Environment.itam_id == server.itam_id,
            Environment.env_id.in_(payload.environments)
        ).all()
        server.environments = envs
    
    db.commit()
    db.refresh(server)
    log_activity(db, current_user.user_id, AuditAction.UPDATE, "Server", f"{itam_id}:{ip_address}:{username}", f"Updated server configurations for: {server.hostname}")
    return server

@router.delete("/servers/{itam_id}/{ip_address}/{username}")
def delete_server(
    itam_id: str,
    ip_address: str,
    username: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("infra.server.delete"))
):
    itam_int = int(itam_id)
    server = db.query(Server).filter(
        Server.itam_id == itam_int,
        Server.ip_address == ip_address,
        Server.username == username
    ).first()
    
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    hostname = server.hostname
    db.delete(server)
    db.commit()
    log_activity(db, current_user.user_id, AuditAction.DELETE, "Server", f"{itam_id}:{ip_address}:{username}", f"Deleted server: {hostname} ({ip_address})")
    return {"status": "success"}

@router.get("/{category}/{itam_id}/servers", response_model=List[ServerOut])
def get_infrastructure_servers(category: str, itam_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    itam_int = int(itam_id)
    # Normalize category (e.g., 'non-production' -> 'Non-Production')
    cat_normalized = "Production" if category.lower() == "production" else "Non-Production"
    return db.query(Server).filter(
        Server.itam_id == itam_int,
        Server.category == cat_normalized
    ).all()

@router.get("/groups")
def get_infrastructure_groups(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.application import Application
    from collections import defaultdict

    apps = db.query(Application).all()
    
    # Structure: {"Category Name": {"categoryId": "category-slug", "apps": {itam_id: {"id": ..., "name": ..., "server_count": ...}}}}
    categories = defaultdict(lambda: {"apps": {}})
    
    for app in apps:
        # category -> server_count
        app_cat_counts = defaultdict(int)
        for s in app.servers if hasattr(app, 'servers') else db.query(Server).filter(Server.itam_id == app.itam_id).all():
            cat = s.category or "Non-Production"
            app_cat_counts[cat] += 1
            
        for cat, count in app_cat_counts.items():
            slug = cat.lower().replace(" ", "-")
            categories[cat]["id"] = slug
            categories[cat]["name"] = cat
            categories[cat]["apps"][app.itam_id] = {
                "id": app.itam_id, 
                "name": app.name,
                "server_count": count
            }

    result = []
    for cat_name, data in categories.items():
        cat_apps = list(data["apps"].values())
        total_count = sum(app["server_count"] for app in cat_apps)
        result.append({
            "id": data.get("id", cat_name.lower().replace(" ", "-")),
            "name": cat_name,
            "total_server_count": total_count,
            "apps": cat_apps
        })
        
    return result
