from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class SKECluster(Base):
    __tablename__ = "ske_clusters"

    cluster_id = Column(String, primary_key=True, index=True) # e.g. "cl-apac-01"
    name = Column(String, nullable=False)
    node_count = Column(Integer, default=0)
    k8s_version = Column(String, nullable=True)
    status = Column(String, default="Healthy")

    services = relationship("SKEService", back_populates="cluster", cascade="all, delete-orphan")

class SKEService(Base):
    __tablename__ = "ske_services"

    cluster_id = Column(String, ForeignKey("ske_clusters.cluster_id", ondelete="CASCADE"), primary_key=True)
    namespace = Column(String, primary_key=True)
    service_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    replicas = Column(Integer, default=1)
    version = Column(String, nullable=True)
    status = Column(String, default="running")
    
    cluster = relationship("SKECluster", back_populates="services")
