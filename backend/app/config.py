from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import List

# Resolve .env from project root (two levels above this file: app/ → backend/ → project root)
_ENV_FILE = str(Path(__file__).parent.parent.parent / ".env")


class Settings(BaseSettings):
    secret_key: str
    database_url: str = "sqlite:///./data/amanah.db"
    cors_origins: str = "http://localhost:5173"
    gemini_api_key: str = ""

    # Check-in timing
    first_check_minutes: int = 5
    check_interval_minutes: int = 3
    response_window_seconds: int = 60
    max_checks_per_session: int = 20

    # Email notifications (optional — skipped if smtp_host is empty)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "AMANAH AI <noreply@amanah.local>"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
