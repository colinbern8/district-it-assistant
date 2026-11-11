"""Safety rules from docs/safety_rules.md, checked against the REAL knowledge base.

If someone edits a workflow and breaks a rule, these tests fail and say which
rule and which workflow. Ported from the Phase 1.5 TypeScript tests.
"""

import json

import pytest

from backend.services.knowledge_base import KnowledgeBase
from backend.settings import DEFAULT_KNOWLEDGE_BASE_DIR

POWERWASH_WORKFLOWS = ["chromebook_frozen", "chromebook_running_slow", "website_or_app_problem"]


def all_ids(kb: KnowledgeBase) -> list[str]:
    return sorted(kb.workflows)


def step_of(workflow, step_id):
    return next(s for s in workflow.steps if s.id == step_id)


def test_real_knowledge_base_loads(real_kb):
    assert len(real_kb.workflows) == 8
    assert sorted(real_kb.published_ids()) == all_ids(real_kb)


@pytest.mark.parametrize(
    "workflow_id",
    ["chromebook_frozen", "chromebook_wont_turn_on", "chromebook_not_charging"],
)
def test_power_workflows_start_with_safety_then_damage(real_kb, workflow_id):
    wf = real_kb.workflows[workflow_id]
    assert wf.category == "power_startup"
    safety = step_of(wf, wf.start_step)
    assert safety.yes == "ESCALATE_SAFETY"
    assert step_of(wf, safety.no).yes == "ESCALATE_DAMAGE"


def test_every_power_workflow_is_covered_above(real_kb):
    power = sorted(w.id for w in real_kb.workflows.values() if w.category == "power_startup")
    assert power == ["chromebook_frozen", "chromebook_not_charging", "chromebook_wont_turn_on"]


def test_yes_means_problem_on_safety_and_damage_questions(real_kb):
    """Habit-clicking "No" must never skip a hazard: only "Yes" may lead to these outcomes."""
    for wf in real_kb.workflows.values():
        for s in wf.steps:
            assert s.no not in ("ESCALATE_SAFETY", "ESCALATE_DAMAGE"), f"{wf.id}/{s.id}"


def test_no_workflow_starts_with_powerwash(real_kb):
    for wf in real_kb.workflows.values():
        assert not wf.start_step.startswith("powerwash"), wf.id


def test_powerwash_only_in_the_three_approved_workflows(real_kb):
    offering = sorted(
        wf.id
        for wf in real_kb.workflows.values()
        if any("powerwash_intro" in (s.yes, s.no) for s in wf.steps)
    )
    assert offering == sorted(POWERWASH_WORKFLOWS)


@pytest.mark.parametrize("workflow_id", POWERWASH_WORKFLOWS)
def test_powerwash_is_reached_only_after_a_restart(real_kb, workflow_id):
    """Powerwash is a last resort: some step before it must be a restart."""
    wf = real_kb.workflows[workflow_id]
    ids = [s.id for s in wf.steps]
    gate = next(s for s in wf.steps if "powerwash_intro" in (s.yes, s.no))
    assert "restart" in ids[: ids.index(gate.id)]


def test_powerwash_procedure_is_draft_and_warns_about_data_loss():
    raw = json.loads((DEFAULT_KNOWLEDGE_BASE_DIR / "shared" / "powerwash.json").read_text())
    assert raw["review_status"] == "draft"
    run = next(s for s in raw["steps"] if s["id"] == "powerwash_run")
    assert run["warning_level"] == "data_loss"


def test_hardware_reset_is_not_a_data_loss_warning(real_kb):
    """Hardware reset and Powerwash must look different (yellow vs red)."""
    for wf in real_kb.workflows.values():
        for s in wf.steps:
            if s.id == "hardware_reset":
                assert s.warning_level == "caution"
                assert "NOT a Powerwash" in (s.warning or "")


def test_no_forbidden_advice(real_kb):
    """Never recommend Developer Mode or recovery (mentioning them only to say STOP is fine)."""
    for wf in real_kb.workflows.values():
        for s in wf.steps:
            text = " ".join(s.instructions).lower()
            assert "developer mode" not in text, f"{wf.id}/{s.id}"
            assert "recovery" not in text, f"{wf.id}/{s.id}"
