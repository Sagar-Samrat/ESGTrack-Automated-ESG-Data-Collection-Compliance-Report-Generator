from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    app_name: str = "ESGTrack"
    app_env: str = "development"
    debug: bool = True
    port: int = 8000
    host: str = "0.0.0.0"

    # JWT Authentication
    jwt_secret_key: str = "esgtrack-super-secure-jwt-secret-key-for-local-development-2025"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    # MongoDB Connection
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "esgtrack_db"

    # Gemini AI
    gemini_api_key: str = ""

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Directories
    upload_dir: str = "./uploads"
    reports_dir: str = "./generated_reports"
    max_upload_size_mb: int = 50

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

