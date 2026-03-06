from __future__ import annotations

import json
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/leylcafe_dev.db"

    # Auth
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # App
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3010",
    ]

    # Import
    max_import_file_mb: int = 20

    @property
    def max_import_bytes(self) -> int:
        return self.max_import_file_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
