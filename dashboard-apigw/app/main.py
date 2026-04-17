import time
import uuid
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.v1 import auth, users, dashboard, applications, infrastructure, ske_management, summary, import_data, settings_ops, security, ai
from app.core.telemetry_engine import init_telemetry_engine, shutdown_telemetry_engine
from app.core.logging_config import setup_logging, correlation_id

# ── Logging Setup ─────────────────────────────────────────────────────────────
logger = setup_logging()

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Handle Correlation ID (Trace ID)
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = correlation_id.set(request_id)
        
        start_time = time.time()
        
        # 2. Capture Request Payload in DEBUG mode (Skip for streaming AI chat to avoid ASGI errors)
        payload = None
        is_streaming_route = request.url.path.startswith("/api/v1/ai/chat")
        
        if settings.DEBUG and not is_streaming_route:
            body = await request.body()
            if body:
                try:
                    payload = json.loads(body)
                    # Masking for security
                    if isinstance(payload, dict):
                        for mask_field in ["password", "secret", "token", "agent_secret"]:
                            if mask_field in payload:
                                payload[mask_field] = "********"
                except:
                    payload = str(body)[:500] # Truncate large non-JSON bodies
            
            # Re-wrap body so downstream handlers can read it
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive

        # 3. Process Request
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        # 4. Structured JSON Logging
        logger.info(f"{request.method} {request.url.path} - {response.status_code}", extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "payload": payload if settings.DEBUG else None,
            "ip": request.client.host if request.client else "unknown"
        })
        
        # Cleanup context
        correlation_id.reset(token)
        
        # Propagate Request ID back to client
        response.headers["X-Request-ID"] = request_id
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialise DB and seed default users
    db = SessionLocal()
    try:
        init_db(db)
        # Start background telemetry engine
        init_telemetry_engine()
    finally:
        db.close()
    
    yield
    
    # Shutdown: gracefully stop background threads
    shutdown_telemetry_engine()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="DevOps Dashboard — Enterprise DevOps Control Center",
    lifespan=lifespan,
)

# ── Middlewares ───────────────────────────────────────────────────────────────
app.add_middleware(LoggingMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(infrastructure.router, prefix="/api/v1")
app.include_router(ske_management.router, prefix="/api/v1")
app.include_router(summary.router, prefix="/api/v1")
app.include_router(import_data.router, prefix="/api/v1")
app.include_router(settings_ops.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1", tags=["AI"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
