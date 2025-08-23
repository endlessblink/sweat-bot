"""
Configuration settings for SweatBot Backend
Uses Pydantic for validation and environment variable management
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "SweatBot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(
        default="your-secret-key-here-change-in-production",
        env="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://fitness_user:secure_password@localhost:5434/hebrew_fitness",
        env="DATABASE_URL"
    )
    
    # Redis
    REDIS_URL: str = Field(
        default="redis://:sweatbot_redis_pass@localhost:6381/0",
        env="REDIS_URL"
    )
    
    # CORS - Use string type and parse it manually
    CORS_ORIGINS_STR: str = Field(
        default="http://localhost:8000,http://localhost:8001,http://localhost:8002,http://localhost:8003,http://localhost:8004,http://localhost:8005,https://sweatbot.app",
        env="CORS_ALLOWED_ORIGINS"
    )
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(',') if origin.strip()]
    
    # Hebrew Models
    MODEL_PATH: Path = Field(
        default=Path("./models"),
        env="MODEL_PATH"
    )
    WHISPER_MODEL: str = Field(
        default="ivrit-ai/whisper-large-v3",
        env="WHISPER_MODEL"
    )
    
    # AI Services
    GEMINI_API_KEY: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    GROQ_API_KEY: Optional[str] = Field(default=None, env="GROQ_API_KEY")
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_AUDIO_FORMATS: List[str] = [".wav", ".mp3", ".webm", ".ogg"]
    
    # WebSocket
    WS_MESSAGE_QUEUE_SIZE: int = 100
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    
    # Gamification
    POINTS_MULTIPLIER_STREAK: float = 1.1
    POINTS_MULTIPLIER_PR: float = 2.0
    POINTS_MULTIPLIER_PERFECT_FORM: float = 1.2
    
    # Performance
    MODEL_CACHE_SIZE: int = 5
    QUERY_CACHE_TTL: int = 300  # 5 minutes
    MAX_WORKERS: int = 4
    
    # Monitoring
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    
    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        """Ensure database URL is valid"""
        if not v.startswith(("postgresql://", "postgres://", "postgresql+asyncpg://")):
            raise ValueError("Database URL must be PostgreSQL")
        return v
    
    @validator("MODEL_PATH")
    def validate_model_path(cls, v):
        """Ensure model path exists"""
        path = Path(v)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
        return path
    
    class Config:
        env_file = [".env", "../.env", ".env.unified"]  # Look in current dir, parent dir, and unified env
        case_sensitive = True
        
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return not self.DEBUG
    
    @property
    def hebrew_models_enabled(self) -> bool:
        """Check if Hebrew models are available"""
        return self.MODEL_PATH.exists() and self.WHISPER_MODEL
    
    def get_db_settings(self) -> dict:
        """Get database connection settings"""
        return {
            "pool_size": 20 if self.is_production else 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 3600
        }
    
    def get_redis_settings(self) -> dict:
        """Get Redis connection settings"""
        return {
            "encoding": "utf-8",
            "decode_responses": True,
            "max_connections": 50 if self.is_production else 10
        }

# Create settings instance
settings = Settings()

# Export commonly used settings
DATABASE_URL = settings.DATABASE_URL
REDIS_URL = settings.REDIS_URL
SECRET_KEY = settings.SECRET_KEY
DEBUG = settings.DEBUG