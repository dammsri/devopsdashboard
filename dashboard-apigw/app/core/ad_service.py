import logging
from typing import List, Optional, Tuple
from ldap3 import Server, Connection, ALL, SUBTREE
from app.core.config import settings

logger = logging.getLogger(__name__)

class ADService:
    def __init__(self):
        self.server_url = settings.AD_SERVER
        self.base_dn = settings.AD_BASE_DN
        self.user_dn_template = settings.AD_USER_DN_TEMPLATE

    def authenticate(self, user_id: str, password: str) -> bool:
        """
        Attempts to authenticate the user against Active Directory.
        """
        if settings.AUTH_MODE == "LOCAL":
            return False

        try:
            # Construct User DN
            user_dn = self.user_dn_template.format(user_id=user_id, base_dn=self.base_dn)
            
            # Create server and connection
            server = Server(self.server_url, get_info=ALL)
            conn = Connection(server, user=user_dn, password=password, check_names=True, auto_bind=True)
            
            if conn.bound:
                logger.info(f"✅ AD authentication successful for user: {user_id}")
                conn.unbind()
                return True
        except Exception as e:
            logger.error(f"❌ AD authentication failed for user {user_id}: {str(e)}")
            return False
        
        return False

    def get_user_info(self, user_id: str) -> Tuple[Optional[str], Optional[str], List[str]]:
        """
        Retrieves user full name, email, and groups from AD.
        Returns: (full_name, email, groups)
        """
        try:
            # For this to work, we usually need a service account to bind and search
            # Or we re-use the user's connection if we just authenticated
            # For this implementation, we assume we can search the base_dn
            
            # Placeholder for actual LDAP search logic
            # In a real AD system, you'd search by sAMAccountName={user_id}
            
            # mock response for now to allow development
            if user_id == "testadmin":
                return "Test Admin", "testadmin@example.com", ["CN=DevOps_Admins,OU=Groups,DC=example,DC=com"]
            
            return None, None, []
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch AD info for {user_id}: {str(e)}")
            return None, None, []

ad_service = ADService()
