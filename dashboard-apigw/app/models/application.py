from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.session import Base

class Application(Base):
    __tablename__ = "applications"

    itam_id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Infrastructure Relationships
    environments = relationship("Environment", back_populates="application", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="application", cascade="all, delete-orphan", overlaps="environment,services")
    servers = relationship("Server", back_populates="application", cascade="all, delete-orphan")

    # SKE Relationships
    ske_clusters = relationship("SKECluster", back_populates="application", cascade="all, delete-orphan")
    ske_namespaces = relationship("SKENamespace", back_populates="application", cascade="all, delete-orphan")
    ske_services = relationship("SKEService", back_populates="application", cascade="all, delete-orphan")
