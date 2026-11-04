import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    port: int = int(os.getenv("PORT", "5000"))


settings = Settings()


def validate_settings() -> None:
    missing = [
        name
        for name, value in {
            "SUPABASE_URL": settings.supabase_url,
            "SUPABASE_ANON_KEY": settings.supabase_anon_key,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
