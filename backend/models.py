"""
The shape of every piece of data the API reads or returns.

Pydantic checks each JSON file against these classes when it loads. A missing
field, a wrong type, a misspelled field name, or a value outside a fixed list
(for example warning_level "scary") becomes a clear error instead of a bug
that a student finds later.

Field names are snake_case to match the JSON files and the TypeScript types
in frontend/lib/types.ts.
"""

from typing import Literal, get_args

from pydantic import BaseModel, ConfigDict

# Special targets that END a workflow instead of pointing to another step.
Outcome = Literal["RESOLVED", "ESCALATE", "ESCALATE_DAMAGE", "ESCALATE_SAFETY"]
OUTCOMES: tuple[str, ...] = get_args(Outcome)

ReviewStatus = Literal["draft", "approved"]
WarningLevel = Literal["caution", "data_loss"]


class StrictModel(BaseModel):
    # "forbid" rejects unknown fields, so a typo like "warnng" is an error.
    model_config = ConfigDict(extra="forbid")


class Step(StrictModel):
    id: str
    title: str
    instructions: list[str]
    warning: str | None = None
    warning_level: WarningLevel | None = None
    question: str
    # Either another step's id or one of the OUTCOMES.
    yes: str
    no: str


class SharedProcedure(StrictModel):
    """Steps written once and added to several workflows (e.g. Powerwash)."""

    id: str
    review_status: ReviewStatus
    entry_step: str
    steps: list[Step]


class Workflow(StrictModel):
    id: str
    version: int
    category: str
    review_status: ReviewStatus
    title: str
    summary: str
    estimated_minutes: int
    start_step: str
    includes: list[str] = []
    steps: list[Step]


class CatalogCategory(StrictModel):
    id: str
    label: str
    # Workflow ids in the order students see them. Listed = published.
    workflows: list[str]


class Catalog(StrictModel):
    categories: list[CatalogCategory]


# ---- API response shapes ----------------------------------------------------


class WorkflowSummary(BaseModel):
    """What the home page needs for one card."""

    id: str
    title: str
    summary: str
    category: str
    estimated_minutes: int
    review_status: ReviewStatus


class CategoryGroup(BaseModel):
    id: str
    label: str
    workflows: list[WorkflowSummary]


class WorkflowList(BaseModel):
    categories: list[CategoryGroup]


class Health(BaseModel):
    status: Literal["ok"]
    app_env: str
    drafts_visible: bool
    workflows_served: int
