"""Endpoints for reading troubleshooting workflows."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Request

from backend.models import Workflow, WorkflowList
from backend.services.knowledge_base import KnowledgeBase
from backend.settings import Settings

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

# Workflow ids are lowercase letters, digits, and underscores. Anything else
# is rejected with a 422 error before our code runs.
WorkflowId = Annotated[str, Path(pattern=r"^[a-z0-9_]{1,64}$", examples=["chromebook_frozen"])]


def _state(request: Request) -> tuple[KnowledgeBase, Settings]:
    return request.app.state.knowledge_base, request.app.state.settings


@router.get("", response_model=WorkflowList, summary="List visible workflows by category")
def list_workflows(request: Request) -> WorkflowList:
    """Every category in catalog order, each with its visible workflows.

    Drafts are included only when APP_ENV is development or demo.
    """
    kb, settings = _state(request)
    return WorkflowList(categories=kb.list_categories(settings.drafts_visible))


@router.get(
    "/{workflow_id}",
    response_model=Workflow,
    # Leave out empty optional fields (e.g. "warning": null), so the JSON has
    # the same shape as the files.
    response_model_exclude_none=True,
    summary="Get one workflow, with shared steps merged in",
    responses={404: {"description": "No visible workflow with this id"}},
)
def get_workflow(workflow_id: WorkflowId, request: Request) -> Workflow:
    kb, settings = _state(request)
    workflow = kb.get_workflow(workflow_id, settings.drafts_visible)
    if workflow is None:
        # Same answer for "doesn't exist" and "hidden draft", so production
        # never reveals which unapproved workflows exist.
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow
