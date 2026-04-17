import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure the app is in the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.application import Application
from app.models.infrastructure import Environment, Server, Service, server_environment_association
from app.models.ske import SKECluster, SKENamespace, SKEEnvironment, SKEService
from app.models.user import User, Role, Functionality, AuthSource
from app.models.audit import AuditLog, AuditAction
from app.core.security import get_password_hash
from app.core.encryption import encrypt_password

def clear_data(db: Session):
    print("🗑️  Cleaning up existing data and schema...")
    # For a full reset, we drop everything and recreate
    # This ensures the latest schema is applied
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db.commit()
    # To be safe, we disable foreign keys temporarily during cleanup
    db.execute(text("PRAGMA foreign_keys = OFF;"))
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.execute(text("PRAGMA foreign_keys = ON;"))
    db.commit()

def seed_security(db: Session):
    print("🔐 Seeding security data...")
    # Permissions
    permissions = [
        ("infra.app.manage", "Create, Update, Delete Applications"),
        ("infra.env.manage", "Manage Environments"),
        ("infra.server.view", "View real-time infrastructure status"),
        ("infra.server.create", "Register New Servers"),
        ("infra.server.update", "Edit Server Configurations"),
        ("infra.server.delete", "Decommission Servers"),
        ("infra.service.manage", "Manage Generic Services"),
        ("ske.cluster.manage", "Manage SKE Environments"),
        ("ske.service.manage", "Manage SKE Services"),
        ("sys.security.manage", "Manage Roles and Permissions"),
    ]
    
    funcs = []
    for name, desc in permissions:
        f = Functionality(name=name, description=desc)
        db.add(f)
        funcs.append(f)
    db.flush()

    # Roles
    super_admin = Role(name="Super Admin", description="Full platform control")
    developer = Role(name="Developer", description="Manage environments and services")
    viewer = Role(name="Viewer", description="Read-only access")
    
    super_admin.functionalities = funcs
    # Limited funcs for dev
    developer.functionalities = [f for f in funcs if "manage" in f.name or "create" in f.name]
    
    db.add_all([super_admin, developer, viewer])
    db.flush()

    # Admin User
    admin = User(
        user_id="admin",
        email="admin@devopsdashboard.io",
        first_name="Platform",
        last_name="Admin",
        hashed_password=get_password_hash("Admin@123"),
        auth_source=AuthSource.local,
        is_active=True,
    )
    admin.roles.append(super_admin)
    db.add(admin)
    db.commit()

def seed_mock_infra(db: Session):
    print("🏗️  Seeding infrastructure data...")
    
    # 1. Applications
    apps = [
        Application(itam_id=1001, name="Core Banking Prime", description="Legacy monolithic banking core"),
        Application(itam_id=1002, name="Nexus Payments", description="Microservices payment gateway"),
        Application(itam_id=1003, name="Insight Analytics", description="Data processing and AI insights")
    ]
    db.add_all(apps)
    db.flush()

    for app in apps:
        # 2. Environments
        envs = [
            Environment(itam_id=app.itam_id, env_id="prod", name="Production", usage="Critical", owner="Bank Ops", interface_connectivity="Internal"),
            Environment(itam_id=app.itam_id, env_id="uat", name="UAT", usage="Testing", owner="QA Team", interface_connectivity="External"),
            Environment(itam_id=app.itam_id, env_id="dev", name="Development", usage="Coding", owner="Dev Team", interface_connectivity="Local")
        ]
        db.add_all(envs)
        db.flush()

        # 3. Servers
        servers = []
        for i in range(1, 4):
            category = "Production" if i == 1 else "Non-Production"
            os = "RHEL 8.6" if i % 2 == 0 else "Ubuntu 22.04"
            server = Server(
                itam_id=app.itam_id,
                ip_address=f"10.{app.itam_id % 1000}.1.{i}",
                username="administrator",
                password=encrypt_password("Welcome@123"),
                hostname=f"{app.name.lower().replace(' ', '-')}-srv-0{i}",
                role="Web Server" if i == 1 else "Database" if i == 2 else "Worker",
                status="Online",
                category=category,
                os=os,
                cpu="4 vCPU",
                memory="16 GB",
                cpu_usage=f"{20 + i*10}%",
                mem_usage=f"{4 + i}GB / 16GB",
                last_heard=datetime.now(timezone.utc)
            )
            # Link to Prod if cat is Production
            if category == "Production":
                server.environments = [envs[0]]
            else:
                # Link to UAT and DEV for others
                server.environments = [envs[1], envs[2]]
            
            servers.append(server)
            db.add(server)
        
        # 4. Services
        services = [
            Service(itam_id=app.itam_id, env_id="prod", name=f"{app.name[:3].lower()}-api", status="running", health_status="healthy"),
            Service(itam_id=app.itam_id, env_id="uat", name=f"{app.name[:3].lower()}-api-stg", status="running", health_status="healthy")
        ]
        db.add_all(services)
        db.flush()

        # 5. SKE Ecosystem
        cluster = SKECluster(
            itam_id=app.itam_id,
            cluster_id=f"cl-{app.itam_id}-01",
            cluster_name=f"{app.name} Cloud Cluster",
            auth_url="https://ske.example.com/api",
            username="ske-admin",
            password=encrypt_password("SKE@123")
        )
        db.add(cluster)
        db.flush()

        ske_env = SKEEnvironment(
            itam_id=app.itam_id,
            cluster_id=cluster.cluster_id,
            ske_env_id=f"env-{app.itam_id}-prod",
            name="SKE Production",
            status="Healthy",
            usage="Production Pods",
            owner="K8s Ops",
            interface_connectivity="High"
        )
        db.add(ske_env)
        db.flush()

        ns = SKENamespace(
            itam_id=app.itam_id, 
            cluster_id=cluster.cluster_id,
            ske_env_id=ske_env.ske_env_id,
            namespace=f"ns-{app.name[:3].lower()}", 
            description="Default namespace", 
            owner="Cloud Team"
        )
        db.add(ns)
        db.flush()

        ske_svc = SKEService(
            itam_id=app.itam_id,
            cluster_id=cluster.cluster_id,
            ske_env_id=ske_env.ske_env_id,
            namespace=ns.namespace,
            service_id=f"svc-{app.itam_id}-core",
            name=f"{app.name} Gateway",
            replicas=3,
            version="v1.2.5",
            status="running",
            health_status="healthy",
            last_deployed_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(ske_svc)

    db.commit()
    print("✨ Seeding complete!")

def main():
    db = SessionLocal()
    try:
        clear_data(db)
        seed_security(db)
        seed_mock_infra(db)
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
