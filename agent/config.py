"""Settings from environment variables (GitHub Secrets) and config/*.yaml."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = ROOT / "config"

DEFAULT_GRAPH_API_VERSION = "v24.0"
DEFAULT_CLAUDE_MODEL = "claude-opus-5-5"


def load_yaml(name: str) -> dict:
    with open(CONFIG_DIR / name, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _env(name: str, default: str = "") -> str:
    # Strip inline comments like ".env.example" has ("v24.0   # set to ...").
    value = os.environ.get(name, default) or default
    return value.split(" #", 1)[0].strip()


def _env_bool(name: str, default: bool) -> bool:
    value = _env(name)
    if not value:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    meta_graph_api_version: str
    meta_access_token: str
    meta_ad_account_id: str
    meta_app_secret: str
    anthropic_api_key: str
    claude_model: str
    telegram_bot_token: str
    telegram_chat_id: str
    google_service_account_json: str
    google_sheet_id: str
    dry_run: bool
    timezone: ZoneInfo

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            meta_graph_api_version=_env("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_API_VERSION,
            meta_access_token=_env("META_ACCESS_TOKEN"),
            meta_ad_account_id=_env("META_AD_ACCOUNT_ID"),
            meta_app_secret=_env("META_APP_SECRET"),
            anthropic_api_key=_env("ANTHROPIC_API_KEY"),
            claude_model=_env("CLAUDE_MODEL") or DEFAULT_CLAUDE_MODEL,
            telegram_bot_token=_env("TELEGRAM_BOT_TOKEN"),
            telegram_chat_id=_env("TELEGRAM_CHAT_ID"),
            google_service_account_json=os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip(),
            google_sheet_id=_env("GOOGLE_SHEET_ID"),
            dry_run=_env_bool("DRY_RUN", True),
            timezone=ZoneInfo(_env("TIMEZONE") or "Asia/Dubai"),
        )

    def secrets(self) -> list[str]:
        """Values that must never appear in logs or messages."""
        return [
            s
            for s in (
                self.meta_access_token,
                self.meta_app_secret,
                self.anthropic_api_key,
                self.telegram_bot_token,
            )
            if s
        ]


def redact(text: str, secrets: list[str]) -> str:
    for s in secrets:
        if s:
            text = text.replace(s, "***")
    return text
