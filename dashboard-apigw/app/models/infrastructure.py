from sqlalchemy import Table, Column, Integer, String, ForeignKey, ForeignKeyConstraint, JSON, DateTime, Float
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.db.session import Base

from app.models.application import Application

# Association table for Server <-> Environment (M2M)
server_environment_association = Table(
    "server_environment_association",
    Base.metadata,
    Column("itam_id", Integer, primary_key=True),
    Column("ip_address", String, primary_key=True),
    Column("username", String, primary_key=True),
    Column("env_id", String, primary_key=True),
    ForeignKeyConstraint(
        ["itam_id", "ip_address", "username"],
        ["servers.itam_id", "servers.ip_address", "servers.username"],
        ondelete="CASCADE"
    ),
    ForeignKeyConstraint(
        ["itam_id", "env_id"],
        ["environments.itam_id", "environments.env_id"],
        ondelete="CASCADE"
    )
)

class Environment(Base):
    __tablename__ = "environments"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    env_id = Column(String, primary_key=True) # e.g. "env-prod"
    name = Column(String, nullable=False)
    status = Column(String, nullable=True)
    
    # New columns
    usage = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    interface_connectivity = Column(String, nullable=True)
    
    application = relationship("Application", back_populates="environments")
    services = relationship("Service", back_populates="environment", cascade="all, delete-orphan", overlaps="application,services")
    servers = relationship("Server", secondary=server_environment_association, back_populates="environments")


class Server(Base):
    __tablename__ = "servers"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    ip_address = Column(String, primary_key=True)
    username = Column(String, primary_key=True)
    
    application = relationship("Application", back_populates="servers")
    password = Column(String, nullable=False) # Encrypted
    hostname = Column(String, nullable=False)
    role = Column(String, nullable=True) # e.g. "Database", "Compute"
    status = Column(String, nullable=True)
    category = Column(String, nullable=True) # e.g "Production", "Non-Production"
    os = Column(String, nullable=True)     # e.g., "RHEL 8.4", "Windows Server 2022"
    cpu = Column(String, nullable=True)    # e.g., "4 vCPU"
    memory = Column(String, nullable=True) # e.g., "16 GB"
    
    environments = relationship("Environment", secondary=server_environment_association, back_populates="servers")
    
    # Telemetry Persistence
    cpu_usage = Column(String, nullable=True) # e.g., "12.5%"
    mem_usage = Column(String, nullable=True) # e.g., "4.2GB / 16GB"
    patch_level = Column(String, nullable=True) # e.g., "Critical: 2, Security: 5"
    last_heard = Column(DateTime(timezone=True), nullable=True)
    agent_endpoint = Column(String, nullable=True) # URL of telemetry agent
    agent_secret = Column(String, nullable=True) # For system-to-system auth


class Service(Base):
    __tablename__ = "services"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    env_id = Column(String, primary_key=True)
    name = Column(String, primary_key=True)
    
    description = Column(String, nullable=True)
    status = Column(String, nullable=True)
    
    # Telemetry / Deployment Persistence
    current_image = Column(String, nullable=True)
    base_image_version = Column(String, nullable=True)
    last_version_deployed = Column(String, nullable=True)
    last_deployed_at = Column(DateTime(timezone=True), nullable=True)
    last_deployed_by = Column(String, nullable=True)
    health_status = Column(String, nullable=True) # running, failed, pending
    telemetry_metadata = Column(JSON, nullable=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ["itam_id", "env_id"],
            ["environments.itam_id", "environments.env_id"],
            ondelete="CASCADE"
        ),
    )

    application = relationship("Application", back_populates="services")
    environment = relationship("Environment", back_populates="services", overlaps="application,services")
