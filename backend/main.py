"""
The FastAPI application.

Run it from the project root:

    APP_ENV=development .venv/bin/python -m uvicorn backend.main:app --reload --port 8000

Then open http://localhost:8000/docs to try the endpoints in your browser.
"""

import logging
from pathlib import Path

from fastapi import FastAPI

from backend.models import Health
from backend.routes import workflows
from backend.services.knowledge_base import load_knowledge_base
from backend.settings import load_settings

logger = logging.getLogger("uvicorn.error")


def create_app(app_env: str | None = None, knowledge_base_dir: Path | None = None) -> FastAPI:
    """Build the app. Loading the knowledge base here means a broken workflow
    file stops the server from starting, instead of failing for a student."""
    settings = load_settings(app_env, knowledge_base_dir)
    knowledge_base = load_knowledge_base(settings.knowledge_base_dir)

    app = FastAPI(
        title="District IT Self-Service API",
        version="0.2.0",
        description="Chromebook troubleshooting workflows for the student self-service assistant.",
    )
    app.state.settings = settings
    app.state.knowledge_base = knowledge_base
    app.include_router(workflows.router)

    @app.get("/api/health", response_model=Health, tags=["health"])
    def health() -> Health:
        served = sum(
            knowledge_base.is_visible(wid, settings.drafts_visible)
            for wid in knowledge_base.published_ids()
        )
        return Health(
            status="ok",
            app_env=settings.app_env,
            drafts_visible=settings.drafts_visible,
            workflows_served=served,
        )

    hidden = len(knowledge_base.published_ids()) - sum(
        knowledge_base.is_visible(wid, settings.drafts_visible)
        for wid in knowledge_base.published_ids()
    )
    logger.info("APP_ENV=%s, drafts visible: %s", settings.app_env, settings.drafts_visible)
    if hidden:
        logger.warning("%d published workflow(s) hidden because they are drafts", hidden)
    return app


app = create_app()
