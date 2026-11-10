"""Shared test helpers (pytest loads this file automatically)."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app
from backend.services.knowledge_base import KnowledgeBase, load_knowledge_base
from backend.settings import DEFAULT_KNOWLEDGE_BASE_DIR


@pytest.fixture(scope="session")
def real_kb() -> KnowledgeBase:
    """The real knowledge_base/ folder that ships with the project."""
    return load_knowledge_base(DEFAULT_KNOWLEDGE_BASE_DIR)


@pytest.fixture
def client_for():
    """Make a test client for a given APP_ENV and (optionally) knowledge base."""

    def make(app_env: str, knowledge_base_dir: Path | None = None) -> TestClient:
        return TestClient(create_app(app_env, knowledge_base_dir))

    return make


def step(step_id: str, yes: str, no: str, **extra) -> dict:
    return {
        "id": step_id,
        "title": step_id.title(),
        "instructions": [f"Do {step_id}"],
        "question": f"{step_id}?",
        "yes": yes,
        "no": no,
        **extra,
    }


def workflow(workflow_id: str, review_status: str = "draft", **extra) -> dict:
    """A tiny valid workflow: a -> b -> outcomes."""
    return {
        "id": workflow_id,
        "version": 1,
        "category": "power_startup",
        "review_status": review_status,
        "title": f"Title {workflow_id}",
        "summary": "Summary",
        "estimated_minutes": 1,
        "start_step": "a",
        "steps": [step("a", "ESCALATE", "b"), step("b", "RESOLVED", "ESCALATE")],
        **extra,
    }


def procedure(review_status: str = "draft") -> dict:
    return {
        "id": "powerwash",
        "review_status": review_status,
        "entry_step": "powerwash_intro",
        "steps": [step("powerwash_intro", "RESOLVED", "ESCALATE", warning_level="data_loss")],
    }


def write_kb(root: Path, workflows: list[dict], published: list[str], procedures=()) -> Path:
    """Write a small knowledge base into `root` for tests."""
    (root / "workflows").mkdir(parents=True)
    (root / "shared").mkdir()
    catalog = {"categories": [{"id": "power_startup", "label": "Power", "workflows": published}]}
    (root / "catalog.json").write_text(json.dumps(catalog))
    for wf in workflows:
        (root / "workflows" / f"{wf['id']}.json").write_text(json.dumps(wf))
    for proc in procedures:
        (root / "shared" / f"{proc['id']}.json").write_text(json.dumps(proc))
    return root
