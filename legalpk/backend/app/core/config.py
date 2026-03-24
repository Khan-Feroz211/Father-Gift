from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "LegalPakistan"
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "changeme-secret-key"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://legalpk:legalpk@localhost:5432/legalpk"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_MAX_TOKENS: int = 4096

    JWT_SECRET_KEY: str = "changeme-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    FAISS_INDEX_PATH: str = "backend/data/faiss/cases.index"
    FAISS_EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    FAISS_TOP_K: int = 10

    UPLOAD_DIR: str = "backend/data/uploads"
    GENERATED_DOCS_DIR: str = "backend/data/generated"
    MAX_UPLOAD_SIZE_MB: int = 10

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM: str = "noreply@legalpakistan.com"

    ALLOWED_ORIGINS: str = "http://localhost:3001"

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    SENTRY_DSN: str = ""

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
