"""MedPredict AI — Pydantic Settings (all config from environment variables)."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # MongoDB
    mongodb_url:    str = "mongodb://localhost:27017"
    database_name:  str = "medpredict"

    # JWT
    jwt_secret_key:              str = "CHANGE_ME_INSECURE_DEFAULT"
    jwt_algorithm:               str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days:   int = 7

    # API
    api_host:        str  = "0.0.0.0"
    api_port:        int  = 8000
    environment:     str  = "development"
    allowed_origins: str  = "http://localhost:5173,http://localhost:3000"

    # Model paths
    model_path:    str = "../ml/models/ensemble_v1.0.0.pkl"
    rf_model_path: str = "../ml/models/rf_pipeline.pkl"

    # Rate limiting
    predict_rate_limit: str = "10/minute"
    login_rate_limit:   str = "5/minute"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
