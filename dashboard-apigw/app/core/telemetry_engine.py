from app.core.logging_config import setup_logging
import requests
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.infrastructure import Server, Service
from app.models.ske import SKEService
from app.core.config import settings

# Separate loggers for each telemetry service
podman_logger = setup_logging("telemetry-podman", "telemetry-podman.log")
ske_logger = setup_logging("telemetry-ske", "telemetry-ske.log")

# Global scheduler instance
scheduler = BackgroundScheduler()

def fetch_podman_telemetry():
    """
    Job to pull metrics from remote Servers via dashboard-telemetry-podman.
    """
    db: Session = SessionLocal()
    try:
        servers = db.query(Server).all()
        for server in servers:
            endpoint = server.agent_endpoint or settings.TELEMETRY_PODMAN_URL
            if not endpoint:
                continue
                
            try:
                headers = {"X-Agent-Secret": server.agent_secret or settings.TELEMETRY_AGENT_SECRET}
                response = requests.get(f"{endpoint}/metrics", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    # Update Server Metrics
                    server.cpu_usage = data["host"]["cpu_usage"]
                    server.mem_usage = data["host"]["mem_usage"]
                    server.patch_level = data["host"]["patch_level"]
                    server.last_heard = datetime.now(timezone.utc)
                    server.status = "Online"
                    
                    # Update Container Services for this server
                    # (In a real system, we'd match containers to services)
                    for container in data.get("containers", []):
                        service = db.query(Service).filter(
                            Service.itam_id == server.itam_id,
                            Service.name == container["name"]
                        ).first()
                        if service:
                            service.current_image = container["image"]
                            service.health_status = container["health"]
                            service.status = container["status"]
                            service.telemetry_metadata = container
                    
                    podman_logger.info(f"📊 Updated Podman telemetry for server: {server.hostname}", extra={"server": server.hostname})
                else:
                    server.status = "Offline"
                    podman_logger.warning(f"⚠️ Failed to reach agent at {endpoint}: {response.status_code}", extra={"endpoint": endpoint, "status_code": response.status_code})
                    
            except Exception as e:
                server.status = "Offline"
                podman_logger.error(f"❌ Error pulling telemetry for {server.hostname}: {str(e)}", extra={"server": server.hostname, "error": str(e)})
        
        db.commit()
    finally:
        db.close()

from app.models.ske import SKEEnvironment, SKEService

def fetch_sketelemetry():
    """
    Job to pull metrics from SKE clusters via dashboard-telemetry-ske.
    """
    db: Session = SessionLocal()
    try:
        # Pulling settings for SKE telemetry
        ske_url = settings.TELEMETRY_SKE_URL
        ske_env_id = settings.TELEMETRY_SKE_ENV_ID
        
        # Resolve parent keys (itam_id, cluster_id) from SKEEnvironment table
        env = db.query(SKEEnvironment).filter(SKEEnvironment.ske_env_id == ske_env_id).first()
        if not env:
            ske_logger.error(f"❌ SKE Telemetry Fail: Environment {ske_env_id} not found in DB", extra={"env_id": ske_env_id})
            return

        try:
            headers = {"X-Agent-Secret": settings.TELEMETRY_AGENT_SECRET}
            response = requests.get(f"{ske_url}/environment/{ske_env_id}/services", headers=headers, timeout=10)
            
            if response.status_code == 200:
                services_data = response.json()
                for s_data in services_data:
                    skeservice = db.query(SKEService).filter(
                        SKEService.itam_id == env.itam_id,
                        SKEService.cluster_id == env.cluster_id,
                        SKEService.ske_env_id == env.ske_env_id,
                        SKEService.namespace == s_data["namespace"],
                        SKEService.service_id == s_data["service_id"]
                    ).first()
                    
                    if skeservice:
                        skeservice.current_image = s_data["current_image"]
                        skeservice.base_image_version = s_data["base_image_version"]
                        skeservice.last_deployed_at = datetime.fromisoformat(s_data["last_deployed_at"].replace('Z', '+00:00'))
                        skeservice.last_deployed_by = s_data["last_deployed_by"]
                        skeservice.health_status = s_data["health_status"]
                        skeservice.status = s_data["status"]
                
                ske_logger.info(f"☸️ Updated SKE telemetry for environment: {ske_env_id} (App: {env.itam_id})", extra={"env_id": ske_env_id, "itam_id": env.itam_id})
            
            db.commit()
        except Exception as e:
            ske_logger.error(f"❌ Error pulling SKE telemetry: {str(e)}", extra={"env_id": ske_env_id, "error": str(e)})
            
    finally:
        db.close()

def init_telemetry_engine():
    """Initializes and starts the background scheduler based on enabled jobs."""
    if not scheduler.running:
        # Register Podman Telemetry if enabled
        if settings.TELEMETRY_PODMAN_ENABLED:
            scheduler.add_job(
                fetch_podman_telemetry,
                trigger=IntervalTrigger(minutes=settings.TELEMETRY_PODMAN_INTERVAL_MINS),
                id="podman_telemetry_pull",
                name="Podman Infrastructure Metric Collection",
                replace_existing=True
            )
            podman_logger.info(f"✅ Podman Telemetry Registered (every {settings.TELEMETRY_PODMAN_INTERVAL_MINS}m)")

        # Register SKE Telemetry if enabled
        if settings.TELEMETRY_SKE_ENABLED:
            scheduler.add_job(
                fetch_sketelemetry,
                trigger=IntervalTrigger(minutes=settings.TELEMETRY_SKE_INTERVAL_MINS),
                id="sketelemetry_pull",
                name="SKE Cluster Service Collection",
                replace_existing=True
            )
            ske_logger.info(f"✅ SKE Telemetry Registered (every {settings.TELEMETRY_SKE_INTERVAL_MINS}m)")
            
        if settings.TELEMETRY_PODMAN_ENABLED or settings.TELEMETRY_SKE_ENABLED:
            scheduler.start()
            podman_logger.info("🚀 Telemetry Engine Started")
        else:
            podman_logger.info("ℹ️ Telemetry Engine NOT started (all jobs disabled)")

def shutdown_telemetry_engine():
    """Gracefully shuts down the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        podman_logger.info("🛑 Telemetry Engine Shutdown Successfully")

def get_job_status():
    """Returns the current status of all background jobs."""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "status": "Running" if scheduler.running else "Stopped"
        })
    return jobs
