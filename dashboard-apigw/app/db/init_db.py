from sqlalchemy.orm import Session
from app.db.session import Base, engine
from app.models.user import User, Role, Functionality, AuthSource
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    """Initialize DB schema and seed default FAP security data."""
    # Ensure tables are created for all models
    from app.models import application, infrastructure, ske, user, audit # noqa
    Base.metadata.create_all(bind=engine)

    # 1. Seed Functionalities (Permissions)
    permissions = [
        ("infra.app.manage", "Create, Update, Delete Applications"),
        ("infra.env.manage", "Manage Environments"),
        ("infra.server.create", "Register New Servers"),
        ("infra.server.update", "Edit Server Configurations"),
        ("infra.server.delete", "Decommission Servers"),
        ("infra.service.manage", "Manage Generic Services"),
        ("ske.cluster.manage", "Manage SKE Environments"),
        ("ske.service.manage", "Manage SKE Services"),
        ("sys.security.manage", "Manage Roles and Permissions"),
    ]
    
    for name, desc in permissions:
        func = db.query(Functionality).filter(Functionality.name == name).first()
        if not func:
            db.add(Functionality(name=name, description=desc))
    
    db.commit()

    # 2. Seed Default Roles
    roles_to_seed = [
        ("Super Admin", "Full platform control", None),
        ("Developer", "Manage environments and services", "CN=DevOps_Developers,OU=Groups,DC=example,DC=com"),
        ("Viewer", "Read-only access", "CN=DevOps_Viewers,OU=Groups,DC=example,DC=com"),
    ]

    for name, desc, ad_group in roles_to_seed:
        role = db.query(Role).filter(Role.name == name).first()
        if not role:
            new_role = Role(name=name, description=desc, ad_group_mapping=ad_group)
            db.add(new_role)
    
    db.commit()

    # 3. Assign All Permissions to Super Admin
    super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    if super_admin_role:
        all_funcs = db.query(Functionality).all()
        super_admin_role.functionalities = all_funcs
        db.commit()

    # 4. Seed/Update Local Admin User
    admin = db.query(User).filter(User.user_id == "admin").first()
    if not admin:
        admin = User(
            user_id="admin",
            email="admin@devopsdashboard.io",
            first_name="Platform",
            last_name="Admin",
            hashed_password=get_password_hash("Admin@123"),
            auth_source=AuthSource.local,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        logger.info("✨ Created default local admin user")
    
    # 5. Link Admin User to Super Admin Role
    if super_admin_role and super_admin_role not in admin.roles:
        admin.roles.append(super_admin_role)
        db.commit()
        logger.info("🔐 Assigned Super Admin role to admin user")

    logger.info("✅ Database initialization and security seeding complete.")
