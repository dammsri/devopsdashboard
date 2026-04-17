from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.dependencies import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.application import Application
from app.models.infrastructure import Environment, Server, Service
from app.models.ske import SKECluster, SKEEnvironment, SKEService, SKENamespace
from app.schemas.settings import ApplicationSummaryOut, SummaryResourceOut

router = APIRouter(prefix="/summary", tags=["Summary"])

@router.get("/{itam_id}", response_model=ApplicationSummaryOut)
def get_application_summary(itam_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Aggregates all associated resources for an application into a single summary view."""
    app = db.query(Application).filter(Application.itam_id == itam_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    resources = []

    # 1. Infrastructure Environments
    envs = db.query(Environment).filter(Environment.itam_id == itam_id).all()
    for env in envs:
        resources.append(SummaryResourceOut(
            name=env.name,
            type="Infra Environment",
            environment=env.env_id,
            status=env.status,
            primary_identifier=env.env_id,
            details={"type": "Infrastructure"}
        ))

    # 2. Infrastructure Servers
    servers = db.query(Server).filter(Server.itam_id == itam_id).all()
    for s in servers:
        resources.append(SummaryResourceOut(
            name=s.hostname,
            type="Infra Server",
            environment=", ".join([e.env_id for e in s.environments]) if s.environments else "N/A",
            status=s.status,
            primary_identifier=s.ip_address,
            details={
                "ip": s.ip_address,
                "os": s.os or "Unknown",
                "cpu": s.cpu or "N/A",
                "memory": s.memory or "N/A",
                "role": s.role or "N/A"
            }
        ))

    # 3. Infrastructure Services
    infra_svcs = db.query(Service).filter(Service.itam_id == itam_id).all()
    for svc in infra_svcs:
        resources.append(SummaryResourceOut(
            name=svc.name,
            type="Infra Service",
            environment=svc.env_id,
            status=svc.status,
            primary_identifier=svc.name,
            details={"description": svc.description or ""}
        ))

    # 4. SKE Clusters
    clusters = db.query(SKECluster).filter(SKECluster.itam_id == itam_id).all()
    for cl in clusters:
        resources.append(SummaryResourceOut(
            name=cl.cluster_name or cl.cluster_id,
            type="SKE Cluster",
            environment="N/A",
            status="Healthy",
            primary_identifier=cl.cluster_id,
            details={"auth_url": cl.auth_url or "Internal"}
        ))

    # 5. SKE Environments
    ske_envs = db.query(SKEEnvironment).filter(SKEEnvironment.itam_id == itam_id).all()
    for se in ske_envs:
        resources.append(SummaryResourceOut(
            name=se.name,
            type="SKE Environment",
            environment=se.ske_env_id,
            status=se.status,
            primary_identifier=se.ske_env_id,
            details={"cluster": se.cluster_id}
        ))

    # 6. SKE Namespaces
    namespaces = db.query(SKENamespace).filter(SKENamespace.itam_id == itam_id).all()
    for ns in namespaces:
        resources.append(SummaryResourceOut(
            name=ns.namespace,
            type="SKE Namespace",
            environment="Global",
            status="Active",
            primary_identifier=ns.namespace,
            details={"owner": ns.owner or "Platform", "description": ns.description or ""}
        ))

    # 7. SKE Services
    ske_svcs = db.query(SKEService).filter(SKEService.itam_id == itam_id).all()
    for ss in ske_svcs:
        resources.append(SummaryResourceOut(
            name=ss.name,
            type="SKE Service",
            environment=ss.ske_env_id,
            status=ss.status,
            primary_identifier=ss.service_id,
            details={
                "namespace": ss.namespace,
                "replicas": ss.replicas,
                "version": ss.version or "latest"
            }
        ))

    return ApplicationSummaryOut(
        itam_id=app.itam_id,
        name=app.name,
        resources=resources
    )
