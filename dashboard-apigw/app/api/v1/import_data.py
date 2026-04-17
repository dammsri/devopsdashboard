import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.application import Application
from app.models.infrastructure import Environment, Server, Service
from app.models.ske import SKECluster, SKEEnvironment, SKEService, SKENamespace
from app.models.user import User
from app.models.audit import AuditAction
from app.core.audit import log_activity
from app.core.dependencies import require_permission
from app.schemas.settings import ImportResult
from app.core.encryption import encrypt_password

router = APIRouter(prefix="/import", tags=["Bulk Import"])

@router.post("/{category}", response_model=ImportResult)
async def import_csv(
    category: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("infra.app.manage"))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    content = await file.read()
    string_content = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(string_content))
    
    success_count = 0
    errors = []
    
    try:
        for row in csv_reader:
            try:
                if category == "applications":
                    item = Application(
                        itam_id=int(row["itam_id"]),
                        name=row["name"],
                        description=row.get("description")
                    )
                    db.merge(item)
                
                elif category == "environments":
                    item = Environment(
                        itam_id=int(row.get("itam_id", row.get("app_id"))),
                        env_id=row["env_id"],
                        name=row["name"],
                        status=row.get("status", "healthy"),
                        usage=row.get("usage"),
                        owner=row.get("owner"),
                        interface_connectivity=row.get("interface_connectivity", row.get("is_connectivity"))
                    )
                    db.merge(item)
                
                elif category == "servers":
                    password = row.get("password", "Welcome@123")
                    encrypted_pwd = encrypt_password(password)
                    
                    envs_raw = row.get("environments", row.get("env_id", ""))
                    environments = [e.strip() for e in envs_raw.split(',') if e.strip()] if envs_raw else []
                    
                    item = Server(
                        itam_id=int(row.get("itam_id", row.get("app_id"))),
                        ip_address=row["ip_address"],
                        username=row["username"],
                        password=encrypted_pwd,
                        hostname=row["hostname"],
                        role=row.get("role"),
                        status=row.get("status", "Online"),
                        category=row.get("category", "Non-Production"),
                        os=row.get("os"),
                        cpu=row.get("cpu"),
                        memory=row.get("memory")
                    )
                    if environments:
                        db_envs = db.query(Environment).filter(
                            Environment.itam_id == item.itam_id,
                            Environment.env_id.in_(environments)
                        ).all()
                        item.environments = db_envs
                    
                    db.merge(item)
                
                elif category == "services":
                    item = Service(
                        itam_id=int(row["itam_id"]),
                        env_id=row["env_id"],
                        name=row["name"],
                        description=row.get("description"),
                        status=row.get("status", "running")
                    )
                    db.merge(item)

                # ── SKE Models ────────────────────────────────────────────────
                
                elif category == "skeclusters":
                    password = row.get("password")
                    if password:
                        password = encrypt_password(password)
                    
                    item = SKECluster(
                        itam_id=int(row["itam_id"]),
                        cluster_id=row["cluster_id"],
                        cluster_name=row.get("cluster_name"),
                        auth_url=row.get("auth_url"),
                        username=row.get("username"),
                        password=password
                    )
                    db.merge(item)

                elif category == "skenamespaces":
                    item = SKENamespace(
                        itam_id=int(row["itam_id"]),
                        namespace=row["namespace"],
                        description=row.get("description"),
                        owner=row.get("owner")
                    )
                    db.merge(item)
                
                elif category == "skeenvironments":
                    item = SKEEnvironment(
                        itam_id=int(row["itam_id"]),
                        cluster_id=row["cluster_id"],
                        ske_env_id=row["ske_env_id"],
                        name=row["name"],
                        status=row.get("status", "Healthy"),
                        usage=row.get("usage"),
                        owner=row.get("owner"),
                        interface_connectivity=row.get("interface_connectivity", row.get("is_connectivity"))
                    )
                    db.merge(item)
                
                elif category == "skeservices":
                    item = SKEService(
                        itam_id=int(row["itam_id"]),
                        cluster_id=row["cluster_id"],
                        ske_env_id=row["ske_env_id"],
                        namespace=row["namespace"],
                        service_id=row["service_id"],
                        name=row["name"],
                        replicas=int(row.get("replicas", 1)),
                        version=row.get("version", "latest"),
                        status=row.get("status", "running")
                    )
                    db.merge(item)
                
                else:
                    raise HTTPException(status_code=400, detail=f"Unsupported category: {category}")
                
                db.flush()
                success_count += 1
            except Exception as e:
                errors.append(f"Row {success_count + len(errors) + 1} error: {str(e)}")
        
        db.commit()
        log_activity(
            db, 
            current_user.user_id, 
            AuditAction.IMPORT, 
            category.capitalize(), 
            None, 
            f"Bulk import to {category}: {success_count} success, {len(errors)} errors"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Critical import error: {str(e)}")
    
    return ImportResult(category=category, success_count=success_count, errors=errors)
