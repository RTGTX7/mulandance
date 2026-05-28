import os
from pydantic import field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache

# Resolve absolute DB path relative to the backend directory.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_DB_PATH = os.path.join(_BACKEND_DIR, "dance_org.db")
_NEWS_FILES_DIR = os.path.join(_PROJECT_DIR, "data", "news")
# Convert to forward slashes for SQLAlchemy SQLite URL
_DB_PATH_FWSLASH = _DB_PATH.replace("\\", "/")
_DATABASE_URL = f"sqlite:///{_DB_PATH_FWSLASH}"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Grace Dance Academy API"
    DATABASE_URL: str = _DATABASE_URL
    SECRET_KEY: str = "change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_HOSTS: str = "http://localhost:3000"
    DEBUG: bool = True
    NEWS_FILES_DIR: str = _NEWS_FILES_DIR
    USE_FILE_STORAGE: bool = True

    @field_validator("DEBUG", "USE_FILE_STORAGE", mode="before")
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

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
