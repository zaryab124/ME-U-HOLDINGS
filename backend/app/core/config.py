import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Restaurant Management & Ordering System"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "SUPER_SECRET_JWT_KEY_FOR_RESTAURANT_SYSTEM_CHANGE_IN_PROD_123456789"
    REFRESH_SECRET_KEY: str = "SUPER_SECRET_REFRESH_KEY_FOR_RESTAURANT_SYSTEM_CHANGE_IN_PROD_987654321"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # Business Logic Defaults
    MAX_CUSTOM_DEAL_DISCOUNT: float = 25.0  # 25% cutoff
    DEFAULT_TAX_PERCENTAGE: float = 5.0
    DEFAULT_DELIVERY_FEE: float = 3.50

    # Databases
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "restaurant_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    USE_SQLITE_FALLBACK: bool = os.getenv("USE_SQLITE_FALLBACK", "false").lower() in ["true", "1", "t"]

    @property
    def DATABASE_URL(self) -> str:
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")
        if self.USE_SQLITE_FALLBACK:
            return "sqlite+aiosqlite:///restaurant_local.db"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
