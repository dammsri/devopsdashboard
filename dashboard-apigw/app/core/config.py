from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache
from typing import List, Any, Union


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DevOps Dashboard"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    SERVICE_NAME: str = "api-gateway"
    
    # Auth Mode
    AUTH_MODE: str = "LOCAL" # LOCAL or ACTIVE_DIRECTORY (AD)

    # AI Configuration
    AI_PROVIDER: str = "gemini"  # "openai" or "gemini"
    AI_SENSITIVE_FIELDS: Union[List[str], str] = ["password", "secret", "token", "key"]

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_INSIGHTS_MODEL: str = "gpt-4o"

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_CHAT_MODEL: str = "gemini-2.0-flash"
    GEMINI_INSIGHTS_MODEL: str = "gemini-2.0-flash"
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"

    @field_validator("AI_SENSITIVE_FIELDS", mode="before")
    @classmethod
    def split_sensitive_fields(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    # Security
    SECRET_KEY: str = "changeme-super-secret-key-at-least-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = "yDy20Mbkm2Fpagsvd5llfgSbKzr1QJuBC4b5FV_A-yA=" # Valid 32-byte Fernet key

    # Database
    DATABASE_URL: str = "sqlite:///./devopsdashboard.db"

    # Active Directory / LDAP
    AD_SERVER: str = "ldap://localhost:389"
    AD_DOMAIN: str = "example.com"
    AD_BASE_DN: str = "dc=example,dc=com"
    AD_USER_DN_TEMPLATE: str = "uid={user_id},ou=users,{base_dn}" # Customized for the specific AD/LDAP layout

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Telemetry
    TELEMETRY_AGENT_SECRET: str = "super-secret-telemetry-key"
    
    # Podman Telemetry
    TELEMETRY_PODMAN_ENABLED: bool = True
    TELEMETRY_PODMAN_INTERVAL_MINS: int = 5
    TELEMETRY_PODMAN_URL: str = "http://localhost:8001"
    
    # SKE Telemetry
    TELEMETRY_SKE_ENABLED: bool = True
    TELEMETRY_SKE_INTERVAL_MINS: int = 5
    TELEMETRY_SKE_URL: str = "http://localhost:8002"
    TELEMETRY_SKE_ENV_ID: str = "cl-apac-01"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_parse_list_separator=","
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
