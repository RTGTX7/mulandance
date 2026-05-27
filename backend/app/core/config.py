import os
from pydantic_settings import BaseSettings
from functools import lru_cache

# Resolve absolute DB path relative to this config file's directory
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DB_PATH = os.path.join(_BACKEND_DIR, "dance_org.db")
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
    NEWS_FILES_DIR: str = "./data/news"
    USE_FILE_STORAGE: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
