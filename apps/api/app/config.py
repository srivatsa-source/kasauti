import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict, field_validator

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_db_url(cls, v):
        if not v or not isinstance(v, str):
            return f"sqlite+aiosqlite:///{ROOT_DIR / 'kasauti.db'}"
        v = v.strip()
        if " #" in v:
            v = v.split(" #")[0].strip()
        if v in ("sqlite+aiosqlite:///./kasauti.db", "sqlite+aiosqlite:///kasauti.db"):
            return f"sqlite+aiosqlite:///{ROOT_DIR / 'kasauti.db'}"
        return v

    @field_validator(
        "BOLNA_API_KEY", "BOLNA_TARGET_AGENT_ID", "BOLNA_STAGING_AGENT_ID",
        "BOLNA_CALLER_AGENT_ID", "BOLNA_TARGET_PHONE", "PUBLIC_WEBHOOK_URL",
        "SARVAM_API_KEY", "ANTHROPIC_API_KEY",
        mode="before"
    )
    @classmethod
    def clean_optional_str(cls, v):
        if not v or not isinstance(v, str):
            return None
        v = v.strip()
        if v.startswith("#") or not v:
            return None
        if " #" in v:
            v = v.split(" #")[0].strip()
        return v or None

    # Bolna Integration
    BOLNA_MODE: str = Field(default="mock", description="mock or real")
    BOLNA_API_KEY: Optional[str] = Field(default=None)
    BOLNA_BASE_URL: str = Field(default="https://api.bolna.ai")
    BOLNA_WEBHOOK_IPS: str = Field(default="13.203.39.153,13.126.9.249,13.202.133.53")
    BOLNA_TARGET_AGENT_ID: Optional[str] = Field(default=None)
    BOLNA_STAGING_AGENT_ID: Optional[str] = Field(default=None)
    BOLNA_CALLER_AGENT_ID: Optional[str] = Field(default=None)
    BOLNA_TARGET_PHONE: Optional[str] = Field(default=None)
    PUBLIC_WEBHOOK_URL: Optional[str] = Field(default=None)
    DIRECTION: str = Field(default="caller_to_target", description="caller_to_target or target_to_caller")

    # Sarvam AI Integration
    SARVAM_MODE: str = Field(default="mock", description="mock or real")
    SARVAM_API_KEY: Optional[str] = Field(default=None)
    SARVAM_BASE_URL: str = Field(default="https://api.sarvam.ai")
    SARVAM_MAX_REQUESTS: int = Field(default=25)

    # LLM Integration
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_MODEL: str = Field(default="claude-sonnet-4-20250514")

    # Database
    DATABASE_URL: str = Field(default=f"sqlite+aiosqlite:///{ROOT_DIR / 'kasauti.db'}")

    # Budget & Safety limits
    BUDGET_USD: float = Field(default=8.0, description="Hard cap on total spend across calls")
    MAX_CALLS_PER_RUN: int = Field(default=3, description="Maximum calls allowed in a single run")
    MAX_CALL_SECONDS: int = Field(default=60, description="Duration limit per call")
    DAILY_SPEND_CAP: float = Field(default=8.0)

    # Server settings
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    API_BASE_URL: str = Field(default="http://localhost:8000")

    # Paths
    RULES_PATH: str = Field(default=str(ROOT_DIR / "rules" / "trai.yaml"))
    SCENARIOS_PATH: str = Field(default=str(ROOT_DIR / "scenarios" / "scenarios.jsonl"))
    FIXTURES_DIR: str = Field(default=str(ROOT_DIR / "fixtures"))

    @property
    def webhook_allowed_ips(self) -> List[str]:
        return [ip.strip() for ip in self.BOLNA_WEBHOOK_IPS.split(",") if ip.strip()]

settings = Settings()
