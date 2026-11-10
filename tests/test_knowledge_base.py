"""Loading, merging, and validating the knowledge base.

These replace the TypeScript validateWorkflow() tests from Phase 1.5: the
backend is now the single place where workflow content is checked.
"""

import json

import pytest

from backend.models import SharedProcedure, Step, Workflow
from backend.services.knowledge_base import (
    KnowledgeBaseError,
    load_knowledge_base,
    merge_shared_steps,
    validate_workflow,
)
from tests.conftest import procedure, step, workflow, write_kb

CATEGORIES = {"power_startup"}


def make(**changes) -> Workflow:
    return Workflow.model_validate({**workflow("sample"), **changes})


# ---- validate_workflow (ported from the Phase 1.5 TypeScript tests) ----------


def test_valid_workflow_has_no_errors():
    assert validate_workflow(make(), CATEGORIES) == []


def test_reports_unknown_target():
    wf = make()
    wf.steps[1].no = "missing_step"
    assert 'step "b" points to unknown target "missing_step"' in validate_workflow(wf, CATEGORIES)


def test_reports_missing_start_step():
    assert validate_workflow(make(start_step="nope"), CATEGORIES) == [
        'start_step "nope" is not a step'
    ]


def test_reports_unreachable_step():
    wf = make()
    wf.steps.append(Step.model_validate(step("c", "RESOLVED", "RESOLVED")))
    assert 'step "c" can never be reached' in validate_workflow(wf, CATEGORIES)


def test_reports_loop():
    wf = make()
    wf.steps[1].no = "a"
    assert 'loop detected: step "a" can lead back to itself' in validate_workflow(wf, CATEGORIES)


def test_reports_duplicate_step_ids():
    wf = make()
    wf.steps.append(wf.steps[1].model_copy())
    assert 'duplicate step id "b"' in validate_workflow(wf, CATEGORIES)


def test_reports_unknown_category():
    assert 'unknown category "printers"' in validate_workflow(make(category="printers"), CATEGORIES)


def test_new_outcomes_are_valid_targets():
    wf = make()
    wf.steps[0].yes = "ESCALATE_SAFETY"
    wf.steps[1].no = "ESCALATE_DAMAGE"
    assert validate_workflow(wf, CATEGORIES) == []


# ---- Pydantic catches bad values and typos when files load -------------------


@pytest.mark.parametrize(
    ("change", "message"),
    [
        ({"review_status": "maybe"}, "review_status"),
        ({"version": "two"}, "version"),
        ({"warnng": "typo"}, "warnng"),
    ],
)
def test_bad_fields_fail_to_load(tmp_path, change, message):
    write_kb(tmp_path, [{**workflow("bad"), **change}], published=["bad"])
    with pytest.raises(KnowledgeBaseError) as exc:
        load_knowledge_base(tmp_path)
    assert any(e.startswith("bad.json") and message in e for e in exc.value.errors)


def test_bad_warning_level_fails_to_load(tmp_path):
    wf = workflow("bad")
    wf["steps"][0]["warning_level"] = "scary"
    write_kb(tmp_path, [wf], published=["bad"])
    with pytest.raises(KnowledgeBaseError, match="warning_level"):
        load_knowledge_base(tmp_path)


def test_invalid_json_fails_to_load(tmp_path):
    write_kb(tmp_path, [], published=[])
    (tmp_path / "workflows" / "broken.json").write_text("{ not json")
    with pytest.raises(KnowledgeBaseError, match="broken.json: invalid JSON"):
        load_knowledge_base(tmp_path)


def test_every_problem_is_reported_at_once(tmp_path):
    one, two = workflow("one"), workflow("two")
    one["start_step"] = "nope"
    two["steps"][1]["no"] = "missing"
    write_kb(tmp_path, [one, two], published=["one", "two"])
    with pytest.raises(KnowledgeBaseError) as exc:
        load_knowledge_base(tmp_path)
    assert len(exc.value.errors) == 2


def test_file_name_must_match_id(tmp_path):
    write_kb(tmp_path, [], published=[])
    (tmp_path / "workflows" / "wrong_name.json").write_text(json.dumps(workflow("right_name")))
    with pytest.raises(KnowledgeBaseError, match="file name must match its id"):
        load_knowledge_base(tmp_path)


# ---- Catalog -----------------------------------------------------------------


def test_catalog_entry_without_file(tmp_path):
    write_kb(tmp_path, [], published=["ghost"])
    with pytest.raises(KnowledgeBaseError, match='"ghost" is missing or invalid'):
        load_knowledge_base(tmp_path)


def test_catalog_entry_listed_twice(tmp_path):
    write_kb(tmp_path, [workflow("one")], published=["one", "one"])
    with pytest.raises(KnowledgeBaseError, match='"one" is listed twice'):
        load_knowledge_base(tmp_path)


def test_catalog_category_must_match_file(tmp_path):
    write_kb(tmp_path, [workflow("one", category="browser_apps")], published=["one"])
    catalog = json.loads((tmp_path / "catalog.json").read_text())
    catalog["categories"].append({"id": "browser_apps", "label": "Browser", "workflows": []})
    (tmp_path / "catalog.json").write_text(json.dumps(catalog))
    with pytest.raises(KnowledgeBaseError, match='listed under "power_startup"'):
        load_knowledge_base(tmp_path)


# ---- Merging shared procedures -----------------------------------------------


def test_merge_adds_procedure_steps_and_keeps_draft():
    proc = SharedProcedure.model_validate(procedure("draft"))
    merged = merge_shared_steps(
        make(review_status="approved", includes=["powerwash"]), {"powerwash": proc}
    )
    assert [s.id for s in merged.steps] == ["a", "b", "powerwash_intro"]
    assert merged.review_status == "draft"  # Powerwash is still a draft.


def test_merge_approved_only_when_everything_is_approved():
    proc = SharedProcedure.model_validate(procedure("approved"))
    merged = merge_shared_steps(
        make(review_status="approved", includes=["powerwash"]), {"powerwash": proc}
    )
    assert merged.review_status == "approved"


def test_merge_does_not_change_the_original():
    original = make(includes=["powerwash"])
    merge_shared_steps(original, {"powerwash": SharedProcedure.model_validate(procedure())})
    assert len(original.steps) == 2


def test_unknown_procedure_fails_to_load(tmp_path):
    write_kb(tmp_path, [workflow("one", includes=["nope"])], published=["one"])
    with pytest.raises(KnowledgeBaseError, match='includes unknown procedure "nope"'):
        load_knowledge_base(tmp_path)


def test_procedure_entry_step_must_exist(tmp_path):
    bad = procedure()
    bad["entry_step"] = "missing"
    write_kb(tmp_path, [], published=[], procedures=[bad])
    with pytest.raises(KnowledgeBaseError, match='entry_step "missing" is not a step'):
        load_knowledge_base(tmp_path)
