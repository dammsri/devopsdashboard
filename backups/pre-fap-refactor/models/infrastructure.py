from sqlalchemy import Column, Integer, String, ForeignKey, ForeignKeyConstraint, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Application(Base):
    __tablename__ = "applications"

    itam_id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    environments = relationship("Environment", back_populates="application", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="application", cascade="all, delete-orphan", overlaps="environment,services")


class Environment(Base):
    __tablename__ = "environments"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    env_id = Column(String, primary_key=True) # e.g. "env-prod"
    name = Column(String, nullable=False)
    status = Column(String, default="healthy")
    
    application = relationship("Application", back_populates="environments")
    services = relationship("Service", back_populates="environment", cascade="all, delete-orphan", overlaps="application,services")


class Server(Base):
    __tablename__ = "servers"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    ip_address = Column(String, primary_key=True)
    username = Column(String, primary_key=True)
    password = Column(String, nullable=False) # Encrypted
    hostname = Column(String, nullable=False)
    role = Column(String, nullable=True) # e.g. "Database", "Compute"
    status = Column(String, default="Online")
    category = Column(String, default="Non-Production")
    os = Column(String, nullable=True)     # e.g., "RHEL 8.4", "Windows Server 2022"
    cpu = Column(String, nullable=True)    # e.g., "4 vCPU"
    memory = Column(String, nullable=True) # e.g., "16 GB"
    
    environments = Column(JSON, default=list)


class Service(Base):
    __tablename__ = "services"

    itam_id = Column(Integer, ForeignKey("applications.itam_id", ondelete="CASCADE"), primary_key=True)
    env_id = Column(String, primary_key=True)
    name = Column(String, primary_key=True)
    
    description = Column(String, nullable=True)
    status = Column(String, default="running")

    __table_args__ = (
        ForeignKeyConstraint(
            ["itam_id", "env_id"],
            ["environments.itam_id", "environments.env_id"],
            ondelete="CASCADE"
        ),
    )

    application = relationship("Application", back_populates="services")
    environment = relationship("Environment", back_populates="services", overlaps="application,services")
