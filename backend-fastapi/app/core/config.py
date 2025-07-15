from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Neon Auth
    NEXT_PUBLIC_STACK_PROJECT_ID: str
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: str
    STACK_SECRET_SERVER_KEY: str
    
    # Stripe
    STRIPE_TEST_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # AI Provider Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    CLAUDE_API_KEY: Optional[str] = None
    
    # App Settings
    SECRET_KEY: str = "your-secret-key-here-please-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = "development"
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()