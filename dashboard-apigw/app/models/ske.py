from sqlalchemy import Column, Integer, String, ForeignKey, ForeignKeyConstraint, DateTime, JSON
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.application import Application

class SKENamespace(Base):
    __tablename__ = "skenamespaces"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    cluster_id = Column(String, primary_key=True)
    ske_env_id = Column(String, primary_key=True)
    namespace = Column(String, primary_key=True)
    
    description = Column(String, nullable=True)
    owner = Column(String, nullable=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ["itam_id", "cluster_id", "ske_env_id"],
            ["skeenvironments.itam_id", "skeenvironments.cluster_id", "skeenvironments.ske_env_id"],
            ondelete="CASCADE"
        ),
    )

    application = relationship("Application", back_populates="ske_namespaces")
    environments = relationship("SKEEnvironment", back_populates="namespaces")
    services = relationship("SKEService", back_populates="namespace_reg", cascade="all, delete-orphan")

class SKECluster(Base):
    __tablename__ = "skeclusters"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    cluster_id = Column(String, primary_key=True)
    cluster_name = Column(String, nullable=True)
    auth_url = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True) # Encrypted

    application = relationship("Application", back_populates="ske_clusters")
    environments = relationship("SKEEnvironment", back_populates="cluster", cascade="all, delete-orphan")

class SKEEnvironment(Base):
    __tablename__ = "skeenvironments"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    cluster_id = Column(String, primary_key=True)
    ske_env_id = Column(String, primary_key=True)
    
    name = Column(String, nullable=False)
    status = Column(String, nullable=True)
    
    # New columns
    usage = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    interface_connectivity = Column(String, nullable=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ["itam_id", "cluster_id"],
            ["skeclusters.itam_id", "skeclusters.cluster_id"],
            ondelete="CASCADE"
        ),
    )

    cluster = relationship("SKECluster", back_populates="environments")
    services = relationship("SKEService", back_populates="environment", cascade="all, delete-orphan")
    namespaces = relationship("SKENamespace", back_populates="environments", cascade="all, delete-orphan")
    application = relationship("Application", overlaps="cluster,environments") # Optional: can be navigated via cluster

class SKEService(Base):
    __tablename__ = "skeservices"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    cluster_id = Column(String, primary_key=True)
    ske_env_id = Column(String, primary_key=True)
    namespace = Column(String, primary_key=True)
    service_id = Column(String, primary_key=True)

    name = Column(String, nullable=False)
    replicas = Column(Integer, nullable=True)
    version = Column(String, nullable=True)
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
            ["itam_id", "cluster_id", "ske_env_id"],
            ["skeenvironments.itam_id", "skeenvironments.cluster_id", "skeenvironments.ske_env_id"],
            ondelete="CASCADE"
        ),
        ForeignKeyConstraint(
            ["itam_id", "cluster_id", "ske_env_id", "namespace"],
            ["skenamespaces.itam_id", "skenamespaces.cluster_id", "skenamespaces.ske_env_id", "skenamespaces.namespace"],
            ondelete="CASCADE"
        ),
    )
    
    environment = relationship("SKEEnvironment", back_populates="services")
    namespace_reg = relationship("SKENamespace", back_populates="services", overlaps="environment,services")
    application = relationship("Application", back_populates="ske_services", overlaps="environment,namespace_reg,services")
