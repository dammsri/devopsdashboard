from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.models.application import Application
from app.models.infrastructure import Environment, Server, Service
from app.models.ske import SKEEnvironment, SKEService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Return live platform statistics"""
    total_apps = db.query(Application).count()
    total_envs = db.query(Environment).count()
    total_servers = db.query(Server).count()
    
    # Combined services from both Infra and SKE
    infra_services = db.query(Service).count()
    skeservices = db.query(SKEService).count()
    total_services = infra_services + skeservices
    
    # Healthy services (status 'running' or 'healthy')
    healthy_infra = db.query(Service).filter(Service.status.in_(['running', 'healthy'])).count()
    healthyske = db.query(SKEService).filter(SKEService.status.in_(['running', 'healthy'])).count()
    healthy_services = healthy_infra + healthyske
    
    success_rate = 100.0
    if total_services > 0:
        success_rate = round((healthy_services / total_services) * 100, 1)

    return {
        "running_pods": db.query(func.sum(SKEService.replicas)).scalar() or 0,
        "healthy_services": healthy_services,
        "active_alerts": db.query(Service).filter(Service.status == 'failed').count() + db.query(SKEService).filter(SKEService.status == 'failed').count(),
        "total_applications": total_apps,
        "total_environments": total_envs,
        "total_servers": total_servers,
        "total_services": total_services,
        "success_rate": success_rate,
    }


@router.get("/activity")
def get_activity(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Return recent activity from AuditLog"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(7).all()
    return [
        {
            "id": log.id,
            "type": log.action,
            "resource": log.resource_type or "System",
            "detail": log.detail,
            "status": log.status,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]


@router.get("/environment-summaries")
def get_environment_summaries(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Aggregation of services and health per SKE environment"""
    envs = db.query(SKEEnvironment).all()
    summaries = []
    
    for env in envs:
        # Proper composite key filtering
        services = db.query(SKEService).filter(
            SKEService.itam_id == env.itam_id,
            SKEService.cluster_id == env.cluster_id,
            SKEService.ske_env_id == env.ske_env_id
        ).all()
        
        total_svcs = len(services)
        healthy_svcs = len([s for s in services if s.status == 'running'])
        
        health_percent = 100
        if total_svcs > 0:
            health_percent = int((healthy_svcs / total_svcs) * 100)
            
        status = "healthy"
        if health_percent < 80: status = "degraded"
        elif health_percent < 100: status = "warning"
        
        summaries.append({
            "id": env.ske_env_id,
            "itam_id": env.itam_id,
            "cluster_id": env.cluster_id,
            "name": env.name,
            "status": status,
            "service_count": total_svcs,
            "health_percent": health_percent
        })
        
    return summaries


@router.get("/metrics/trends")
def get_trends(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """
    Returns time-series data for dashboard charts.
    Mocks 7 days of historical health data based on current state.
    """
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    # Base success rate from current status
    total_services = db.query(Service).count() + db.query(SKEService).count()
    healthy_infra = db.query(Service).filter(Service.status.in_(['running', 'healthy'])).count()
    healthyske = db.query(SKEService).filter(SKEService.status.in_(['running', 'healthy'])).count()
    healthy_services = healthy_infra + healthyske
    
    current_rate = 100 if total_services == 0 else int((healthy_services / total_services) * 100)
    
    # Generate some slightly variable trend data
    import random
    success_trend = []
    deployment_trend = []
    
    for label in labels:
        # Success rate +/- 5%
        rate = max(80, min(100, current_rate + random.randint(-5, 5)))
        success_trend.append({"name": label, "rate": rate})
        # Deployments: 5-20 per day
        deployment_trend.append({"name": label, "deploys": random.randint(5, 25)})
        
    return {
        "success_rate_trend": success_trend,
        "deployments_trend": deployment_trend,
        "cluster_allocation": [
             {"name": "Compute", "value": 45},
             {"name": "Storage", "value": 25},
             {"name": "Network", "value": 15},
             {"name": "Database", "value": 15}
        ]
    }
