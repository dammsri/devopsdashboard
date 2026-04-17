import os
import time
import uuid
import json
from fastapi import FastAPI, HTTPException, Header, Request
from typing import Optional, List, Dict
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import setup_logging, correlation_id

# ── Logging Setup ─────────────────────────────────────────────────────────────
os.environ.setdefault("SERVICE_NAME", "telemetry-ske")
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

app = FastAPI(title="DevOps Dashboard - SKE Telemetry Collector")
app.add_middleware(LoggingMiddleware)

AGENT_SECRET = os.getenv("AGENT_SECRET", "super-secret-telemetry-key")

def verify_token(x_agent_secret: str = Header(None)):
    if x_agent_secret != AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid Agent Secret")

@app.get("/health")
def health():
    return {"status": "up"}

@app.get("/environment/{ske_env_id}/services")
def get_environment_services(ske_env_id: str, x_agent_secret: str = Header(None)):
    verify_token(x_agent_secret)
    
    # Mock Kubernetes Service/Deployment metrics
    # In production, use kubernetes python client to fetch from specific namespaces
    return [
        {
            "namespace": "payments",
            "service_id": "payment-api",
            "name": "payment-api",
            "replicas": 3,
            "status": "running",
            "current_image": "payments/api:v2.1.5",
            "base_image_version": "openjdk:17-alpine",
            "last_deployed_at": "2026-04-10T14:30:00Z",
            "last_deployed_by": "jdoe"
        },
        {
            "namespace": "payments",
            "service_id": "auth-svc",
            "name": "auth-svc",
            "replicas": 2,
            "status": "warning",
            "current_image": "payments/auth:v1.9.2",
            "base_image_version": "node:20-slim",
            "last_deployed_at": "2026-04-11T09:15:00Z",
            "last_deployed_by": "asmith"
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
