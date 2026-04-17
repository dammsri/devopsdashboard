from typing import Optional, List, Any
from pydantic import BaseModel

# ── Application Schemas ───────────────────────────────────────────────────────
class ApplicationBase(BaseModel):
    itam_id: int
    name: str
    description: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# ── Environment Schemas ───────────────────────────────────────────────────────
class EnvironmentBase(BaseModel):
    itam_id: int
    env_id: str
    name: str
    status: Optional[str] = "healthy"
    usage: Optional[str] = None
    owner: Optional[str] = None
    interface_connectivity: Optional[str] = None

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    usage: Optional[str] = None
    owner: Optional[str] = None
    interface_connectivity: Optional[str] = None

# ── Service Schemas (Generic) ────────────────────────────────────────────────
class ServiceBase(BaseModel):
    itam_id: int
    env_id: str
    name: str
    description: Optional[str] = None
    status: Optional[str] = "running"

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None

class ServiceOut(ServiceBase):
    class Config:
        from_attributes = True

# ── Out Schemas with Nesting ──────────────────────────────────────────────────
class EnvironmentOut(EnvironmentBase):
    services: List[ServiceOut] = []
    class Config:
        from_attributes = True

class ApplicationOut(ApplicationBase):
    environments: List[EnvironmentOut] = []
    class Config:
        from_attributes = True

# ── Server Schemas ────────────────────────────────────────────────────────────
class ServerBase(BaseModel):
    ip_address: str
    username: str
    hostname: str
    role: Optional[str] = None
    status: str = "Online"
    category: str = "Non-Production"
    os: Optional[str] = None
    cpu: Optional[str] = None
    memory: Optional[str] = None
    itam_id: int
    environments: List[str] = []

class ServerCreate(ServerBase):
    password: str

class ServerUpdate(BaseModel):
    hostname: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    os: Optional[str] = None
    cpu: Optional[str] = None
    memory: Optional[str] = None
    password: Optional[str] = None
    itam_id: Optional[int] = None
    environments: Optional[List[str]] = None

class ServerOut(ServerBase):
    environments: List[EnvironmentOut] = []
    # Password omitted from Out schema for security
    class Config:
        from_attributes = True

# ── SKE Cluster Schemas ───────────────────────────────────────────────────────
class SKEClusterBase(BaseModel):
    itam_id: int
    cluster_id: str
    cluster_name: Optional[str] = None
    auth_url: Optional[str] = None
    username: Optional[str] = None

class SKEClusterCreate(SKEClusterBase):
    password: Optional[str] = None

class SKEClusterUpdate(BaseModel):
    cluster_name: Optional[str] = None
    auth_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class SKEClusterOut(SKEClusterBase):
    class Config:
        from_attributes = True

# ── SKE Namespace Schemas ─────────────────────────────────────────────────────
class SKENamespaceBase(BaseModel):
    itam_id: int
    cluster_id: str
    ske_env_id: str
    namespace: str
    description: Optional[str] = None
    owner: Optional[str] = None

class SKENamespaceCreate(SKENamespaceBase):
    pass

class SKENamespaceUpdate(BaseModel):
    description: Optional[str] = None
    owner: Optional[str] = None

class SKENamespaceOut(SKENamespaceBase):
    class Config:
        from_attributes = True

# ── SKE Environment Schemas ───────────────────────────────────────────────────
class SKEEnvironmentBase(BaseModel):
    itam_id: int
    cluster_id: str
    ske_env_id: str
    name: str
    status: str = "Healthy"
    usage: Optional[str] = None
    owner: Optional[str] = None
    interface_connectivity: Optional[str] = None

class SKEEnvironmentCreate(SKEEnvironmentBase):
    pass

class SKEEnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    usage: Optional[str] = None
    owner: Optional[str] = None
    interface_connectivity: Optional[str] = None

class SKEEnvironmentOut(SKEEnvironmentBase):
    class Config:
        from_attributes = True

# ── SKE Service Schemas ───────────────────────────────────────────────────────
class SKEServiceBase(BaseModel):
    itam_id: int
    cluster_id: str
    ske_env_id: str
    namespace: str
    service_id: str
    name: str
    replicas: int = 1
    version: Optional[str] = None
    status: str = "running"

class SKEServiceCreate(SKEServiceBase):
    pass

class SKEServiceUpdate(BaseModel):
    name: Optional[str] = None
    replicas: Optional[int] = None
    version: Optional[str] = None
    status: Optional[str] = None

class SKEServiceOut(SKEServiceBase):
    telemetry_metadata: Optional[Any] = None
    class Config:
        from_attributes = True

# ── Summary Schemas ───────────────────────────────────────────────────────────
class SummaryResourceOut(BaseModel):
    name: str
    type: str
    environment: str
    status: Optional[str] = "unknown"
    primary_identifier: str
    details: Optional[Any] = None

class ApplicationSummaryOut(BaseModel):
    itam_id: int
    name: str
    resources: List[SummaryResourceOut] = []

# ── Import Schemas ────────────────────────────────────────────────────────────
class ImportResult(BaseModel):
    category: str
    success_count: int
    errors: List[str] = []
