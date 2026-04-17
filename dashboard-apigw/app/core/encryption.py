from cryptography.fernet import Fernet
from app.core.config import settings

def get_fernet() -> Fernet:
    """Initialize Fernet with the configured encryption key."""
    return Fernet(settings.ENCRYPTION_KEY.encode())

def encrypt_password(password: str) -> str:
    """Encrypt a plain text password and return the base64 encoded string."""
    f = get_fernet()
    return f.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    """Decrypt a base64 encoded string and return the plain text password."""
    f = get_fernet()
    return f.decrypt(encrypted_password.encode()).decode()
