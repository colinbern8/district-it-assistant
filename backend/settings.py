"""
Settings read from environment variables.

APP_ENV decides whether DRAFT workflows are shown:

    development  drafts visible   (your computer, Codespaces)
    demo         drafts visible   (showing the proof of concept to staff)
    production   drafts hidden    (students; only technician-approved content)

The default is "production". If someone forgets to set APP_ENV, the safe
choice is to hide unreviewed content, not to show it.
"""

import os
from dataclasses import dataclass
from pathlib import Path

APP_ENVS = ("development", "demo", "production")
DEFAULT_KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"


@dataclass(frozen=True)
class Settings:
    app_env: str
    knowledge_base_dir: Path

    @property
    def drafts_visible(self) -> bool:
        return self.app_env in ("development", "demo")


def load_settings(app_env: str | None = None, knowledge_base_dir: Path | None = None) -> Settings:
    """Arguments win over environment variables (handy in tests)."""
    env = (app_env or os.environ.get("APP_ENV") or "production").strip().lower()
    if env not in APP_ENVS:
        raise ValueError(f'APP_ENV must be one of {", ".join(APP_ENVS)} (got "{env}")')

    kb_dir = knowledge_base_dir or Path(
        os.environ.get("KNOWLEDGE_BASE_DIR", DEFAULT_KNOWLEDGE_BASE_DIR)
    )
    return Settings(app_env=env, knowledge_base_dir=kb_dir)
