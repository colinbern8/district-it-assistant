"""
Load, merge, and validate the troubleshooting knowledge base.

This is the single source of truth for workflow content. The API loads the
knowledge base once, at startup. If ANY file has a problem, loading fails with
a list of every problem found, and the server does not start. A broken
workflow can never be served to a student.

Three separate ideas decide whether a student can see a workflow:

* review_status  "draft" or "approved", set in each file by a technician.
* published      the workflow is listed in catalog.json.
* visible        published AND (approved OR drafts are allowed in this mode).

A workflow counts as approved only if it AND every shared procedure it
includes (such as Powerwash) are approved.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel, ValidationError

from backend.models import (
    OUTCOMES,
    Catalog,
    CategoryGroup,
    SharedProcedure,
    Workflow,
    WorkflowSummary,
)


class KnowledgeBaseError(Exception):
    """Raised when the knowledge base has problems. `errors` lists every one."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(
            "The knowledge base has problems:\n" + "\n".join(f"  - {e}" for e in errors)
        )


@dataclass(frozen=True)
class KnowledgeBase:
    catalog: Catalog
    # Every workflow file, with shared procedures merged in, keyed by id.
    workflows: dict[str, Workflow]

    def published_ids(self) -> list[str]:
        return [wid for category in self.catalog.categories for wid in category.workflows]

    def is_visible(self, workflow_id: str, include_drafts: bool) -> bool:
        workflow = self.workflows.get(workflow_id)
        if workflow is None or workflow_id not in self.published_ids():
            return False
        return include_drafts or workflow.review_status == "approved"

    def get_workflow(self, workflow_id: str, include_drafts: bool) -> Workflow | None:
        if not self.is_visible(workflow_id, include_drafts):
            return None
        return self.workflows[workflow_id]

    def list_categories(self, include_drafts: bool) -> list[CategoryGroup]:
        """Every category in catalog order, with only its visible workflows."""
        return [
            CategoryGroup(
                id=category.id,
                label=category.label,
                workflows=[
                    WorkflowSummary(**self.workflows[wid].model_dump())
                    for wid in category.workflows
                    if self.is_visible(wid, include_drafts)
                ],
            )
            for category in self.catalog.categories
        ]


# ---- Loading ----------------------------------------------------------------


def load_knowledge_base(root: Path) -> KnowledgeBase:
    """Read every file under `root`, merge, validate, and return the result."""
    errors: list[str] = []

    catalog = _read_model(root / "catalog.json", Catalog, errors)

    procedures: dict[str, SharedProcedure] = {}
    for path in sorted((root / "shared").glob("*.json")):
        procedure = _read_model(path, SharedProcedure, errors)
        if procedure:
            _check_file_name(path, procedure.id, errors)
            errors += [f"{path.name}: {e}" for e in validate_procedure(procedure)]
            procedures[procedure.id] = procedure

    workflows: dict[str, Workflow] = {}
    for path in sorted((root / "workflows").glob("*.json")):
        workflow = _read_model(path, Workflow, errors)
        if not workflow:
            continue
        _check_file_name(path, workflow.id, errors)
        try:
            workflows[workflow.id] = merge_shared_steps(workflow, procedures)
        except ValueError as exc:
            errors.append(f"{path.name}: {exc}")

    if catalog:
        category_ids = {c.id for c in catalog.categories}
        for workflow in workflows.values():
            errors += [
                f"{workflow.id}.json: {e}" for e in validate_workflow(workflow, category_ids)
            ]
        errors += validate_catalog(catalog, workflows)

    if errors:
        raise KnowledgeBaseError(errors)
    assert catalog is not None  # No errors means the catalog loaded.
    return KnowledgeBase(catalog=catalog, workflows=workflows)


def _read_model[M: BaseModel](path: Path, model: type[M], errors: list[str]) -> M | None:
    """Parse one JSON file into `model`. Problems go into `errors`."""
    try:
        return model.model_validate(json.loads(path.read_text(encoding="utf-8")))
    except FileNotFoundError:
        errors.append(f"{path.name}: file not found")
    except json.JSONDecodeError as exc:
        errors.append(f"{path.name}: invalid JSON ({exc})")
    except ValidationError as exc:
        for err in exc.errors():
            location = ".".join(str(part) for part in err["loc"])
            errors.append(f"{path.name}: {location}: {err['msg']}")
    return None


def _check_file_name(path: Path, item_id: str, errors: list[str]) -> None:
    if path.stem != item_id:
        errors.append(f'{path.name}: file name must match its id ("{item_id}.json")')


# ---- Merging ----------------------------------------------------------------


def merge_shared_steps(workflow: Workflow, procedures: dict[str, SharedProcedure]) -> Workflow:
    """Return a copy of `workflow` with the steps of every included procedure added.

    The result is approved only if the workflow and everything it includes are
    approved, so an unreviewed Powerwash procedure keeps the workflow a draft.
    """
    included: list[SharedProcedure] = []
    for procedure_id in workflow.includes:
        if procedure_id not in procedures:
            raise ValueError(f'includes unknown procedure "{procedure_id}"')
        included.append(procedures[procedure_id])

    all_approved = workflow.review_status == "approved" and all(
        p.review_status == "approved" for p in included
    )
    return workflow.model_copy(
        update={
            "review_status": "approved" if all_approved else "draft",
            "steps": workflow.steps + [step for p in included for step in p.steps],
        }
    )


# ---- Validation ---------------------------------------------------------------


def is_outcome(target: str) -> bool:
    return target in OUTCOMES


def validate_workflow(workflow: Workflow, category_ids: set[str]) -> list[str]:
    """Find authoring mistakes in one (already merged) workflow.

    Checks: known category, duplicate step ids, a missing start step, Yes/No
    targets that point nowhere, steps nobody can reach, and loops that could
    trap a student. Returns an empty list when the workflow is valid.
    """
    errors: list[str] = []
    if workflow.category not in category_ids:
        errors.append(f'unknown category "{workflow.category}"')

    ids: set[str] = set()
    for step in workflow.steps:
        if step.id in ids:
            errors.append(f'duplicate step id "{step.id}"')
        ids.add(step.id)

    if workflow.start_step not in ids:
        errors.append(f'start_step "{workflow.start_step}" is not a step')
        return errors  # The checks below need a valid start.

    for step in workflow.steps:
        for target in (step.yes, step.no):
            if not is_outcome(target) and target not in ids:
                errors.append(f'step "{step.id}" points to unknown target "{target}"')
    if errors:
        return errors

    # Walk every path from the start step (depth-first search). "on_path" holds
    # the steps on the current path, so meeting one again means a loop.
    steps = {step.id: step for step in workflow.steps}
    reached: set[str] = set()
    on_path: set[str] = set()

    def walk(step_id: str) -> None:
        if step_id in on_path:
            errors.append(f'loop detected: step "{step_id}" can lead back to itself')
            return
        if step_id in reached:
            return
        reached.add(step_id)
        on_path.add(step_id)
        for target in (steps[step_id].yes, steps[step_id].no):
            if not is_outcome(target):
                walk(target)
        on_path.discard(step_id)

    walk(workflow.start_step)

    for step_id in steps:
        if step_id not in reached:
            errors.append(f'step "{step_id}" can never be reached')
    return errors


def validate_procedure(procedure: SharedProcedure) -> list[str]:
    ids = [step.id for step in procedure.steps]
    if procedure.entry_step not in ids:
        return [f'entry_step "{procedure.entry_step}" is not a step']
    return []


def validate_catalog(catalog: Catalog, workflows: dict[str, Workflow]) -> list[str]:
    """The catalog must list real workflows, once each, in their own category."""
    errors: list[str] = []
    seen_categories: set[str] = set()
    seen_workflows: set[str] = set()

    for category in catalog.categories:
        if category.id in seen_categories:
            errors.append(f'catalog.json: category "{category.id}" is listed twice')
        seen_categories.add(category.id)

        for wid in category.workflows:
            if wid in seen_workflows:
                errors.append(f'catalog.json: workflow "{wid}" is listed twice')
            seen_workflows.add(wid)

            workflow = workflows.get(wid)
            if workflow is None:
                # Either there's no file, or it failed to load (its errors are listed too).
                errors.append(f'catalog.json: workflow "{wid}" is missing or invalid in workflows/')
            elif workflow.category != category.id:
                errors.append(
                    f'catalog.json: workflow "{wid}" is listed under "{category.id}" '
                    f'but its file says category "{workflow.category}"'
                )
    return errors
