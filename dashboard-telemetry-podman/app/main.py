import os
import psutil
import time
import uuid
import json
from fastapi import FastAPI, HTTPException, Header, Request
from typing import Optional, List, Dict
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import setup_logging, correlation_id

# ── Logging Setup ─────────────────────────────────────────────────────────────
os.environ.setdefault("SERVICE_NAME", "telemetry-podman")
logger = setup_logging()

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = correlation_id.set(request_id)
        start_time = time.time()
        
        # Capture Payload in DEBUG
        payload = None
        if os.getenv("LOG_LEVEL") == "DEBUG":
            body = await request.body()
            if body:
                try:
                    payload = json.loads(body)
                except:
                    payload = str(body)[:500]
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive

        response = await call_next(request)
        duration = time.time() - start_time
        
        logger.info(f"{request.method} {request.url.path} - {response.status_code}", extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "payload": payload if os.getenv("LOG_LEVEL") == "DEBUG" else None
        })
        
        correlation_id.reset(token)
        response.headers["X-Request-ID"] = request_id
        return response

app = FastAPI(title="DevOps Dashboard - Podman Telemetry Collector")
app.add_middleware(LoggingMiddleware)

# Simple secret for system-to-system auth (in real world, use env/vault)
AGENT_SECRET = os.getenv("AGENT_SECRET", "super-secret-telemetry-key")

def verify_token(x_agent_secret: str = Header(None)):
    if x_agent_secret != AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid Agent Secret")

@app.get("/health")
def health():
    return {"status": "up"}

@app.get("/metrics")
def get_metrics(x_agent_secret: str = Header(None)):
    verify_token(x_agent_secret)
    
    # Host Metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    
    # Mock Container Metrics (in production, use podman/docker python SDK)
    mock_containers = [
        {
            "name": "api-gateway",
            "image": "devops/apigw:v1.2.3",
            "status": "running",
            "health": "healthy",
            "cpu_usage": "2.5%",
            "mem_usage": "256MB"
        },
        {
            "name": "frontend",
            "image": "devops/frontend:v1.1.0",
            "status": "running",
            "health": "healthy",
            "cpu_usage": "1.2%",
            "mem_usage": "128MB"
        }
    ]
    
    return {
        "host": {
            "cpu_usage": f"{cpu_percent}%",
            "mem_usage": f"{memory.used // (1024*1024)}MB / {memory.total // (1024*1024)}MB",
            "uptime": "5d 12h",
            "patch_level": "None"
        },
        "containers": mock_containers
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
