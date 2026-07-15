import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Resolve absolute DB path relative to the backend directory.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_DB_PATH = os.path.join(_BACKEND_DIR, "dance_org.db")
_DATA_DIR = os.path.join(_PROJECT_DIR, "data")
_NEWS_FILES_DIR = os.path.join(_DATA_DIR, "news")
_UPLOADS_DIR = os.path.join(_DATA_DIR, "uploads")
# Convert to forward slashes for SQLAlchemy SQLite URL
_DB_PATH_FWSLASH = _DB_PATH.replace("\\", "/")
_DATABASE_URL = f"sqlite:///{_DB_PATH_FWSLASH}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Mulan Dance Studio API"
    APP_VERSION: str = "2.3.0-alpha.3"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = _DATABASE_URL
    SECRET_KEY: str = "change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_HOSTS: str = "http://localhost:3000"
    DEBUG: bool = True
    DATA_DIR: str = _DATA_DIR
    NEWS_FILES_DIR: str = _NEWS_FILES_DIR
    UPLOADS_DIR: str = _UPLOADS_DIR
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    USE_FILE_STORAGE: bool = True
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True
    AI_ENABLED: bool = False
    AI_PROVIDER: str = "openai_compatible"
    AI_API_BASE_URL: str = "https://api.openai.com/v1"
    AI_API_KEY: str = ""
    AI_MODEL: str = ""
    AI_TIMEOUT_SECONDS: int = 600
    AI_MAX_URLS: int = 10
    AI_MAX_IMAGES_PER_URL: int = 5
    ADMIN_EMAIL: str = ""
    ADMIN_FIRST_NAME: str = "Mulan"
    ADMIN_LAST_NAME: str = "Admin"
    LOGTO_ENDPOINT: str = ""
    LOGTO_API_RESOURCE: str = ""
    LOGTO_SESSION_ASSERTION_SECRET: str = ""
    LOGTO_BOOTSTRAP_SUPER_ADMIN_EMAIL: str = ""
    LOGTO_BOOTSTRAP_SUPER_ADMIN_SUB: str = ""
    DEV_AUTH_BYPASS: bool = False
    DEV_AUTH_EMAIL: str = ""
    DEV_AUTH_SECRET: str = ""

    @field_validator("DEBUG", "USE_FILE_STORAGE", "SMTP_USE_TLS", "AI_ENABLED", "DEV_AUTH_BYPASS", mode="before")
    @classmethod
    def parse_bool_like_env(cls, value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return value


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
