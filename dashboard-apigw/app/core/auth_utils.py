from sqlalchemy.orm import Session
from app.models.user import User, Role, AuthSource
from typing import List
import logging

logger = logging.getLogger(__name__)

def sync_user_ad_roles(db: Session, user: User, ad_groups: List[str]):
    """
    Syncs the user's local roles based on their Active Directory groups.
    """
    if not ad_groups:
        return

    # Find all roles that match any of the AD groups
    # We check if ad_group_mapping is in the list of groups or vice versa
    # (Flexible string mapping as per plan)
    matching_roles = db.query(Role).filter(
        Role.ad_group_mapping.in_(ad_groups)
    ).all()

    if matching_roles:
        user.roles = matching_roles
        logger.info(f"🔄 Synced {len(matching_roles)} roles for user {user.user_id} from AD groups")
    else:
        logger.warning(f"⚠️ No matching local roles found for AD groups: {ad_groups}")

def jit_provision_user(db: Session, user_id: str, full_name: str, email: str, ad_groups: List[str]) -> User:
    """
    Creates or updates a local user record after a successful Active Directory login.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        # Split full_name into first and last name
        names = full_name.split(" ", 1)
        first_name = names[0] if names else "Unknown"
        last_name = names[1] if len(names) > 1 else ""

        # Create new AD user
        user = User(
            user_id=user_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            auth_source=AuthSource.ad,
            is_external=True,
            is_active=True
        )
        db.add(user)
        logger.info(f"✨ JIT Provisioned new AD user: {user_id}")
    else:
        # Update existing user details to sync with AD
        names = full_name.split(" ", 1)
        user.first_name = names[0] if names else "Unknown"
        user.last_name = names[1] if len(names) > 1 else ""
        user.email = email
        user.is_external = True
        user.auth_source = AuthSource.ad
        logger.info(f"✅ Synced existing user {user_id} with AD details")

    # Sync roles
    sync_user_ad_roles(db, user, ad_groups)
    
    db.commit()
    return user
