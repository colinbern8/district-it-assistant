"""The HTTP endpoints, tested through FastAPI's TestClient (no server needed)."""

import json

from tests.conftest import procedure, workflow, write_kb

CATALOG_ORDER = [
    ("power_startup", ["chromebook_frozen", "chromebook_wont_turn_on", "chromebook_not_charging"]),
    ("wifi_connectivity", []),
    ("audio_camera_mic", ["no_sound", "camera_or_mic_not_working"]),
    ("browser_apps", ["website_or_app_problem", "chromebook_running_slow"]),
    ("login_account", ["cant_sign_in"]),
]


def test_health(client_for):
    body = client_for("development").get("/api/health").json()
    assert body == {
        "status": "ok",
        "app_env": "development",
        "drafts_visible": True,
        "workflows_served": 8,
    }


def test_list_follows_catalog_order(client_for):
    body = client_for("development").get("/api/workflows").json()
    order = [(g["id"], [w["id"] for w in g["workflows"]]) for g in body["categories"]]
    assert order == CATALOG_ORDER
    assert body["categories"][0]["label"] == "Power and startup"


def test_list_summary_fields(client_for):
    card = client_for("development").get("/api/workflows").json()["categories"][0]["workflows"][0]
    assert card == {
        "id": "chromebook_frozen",
        "title": "My Chromebook is frozen",
        "summary": "The screen is stuck, or the Chromebook won't respond when you click or type.",
        "category": "power_startup",
        "estimated_minutes": 10,
        "review_status": "draft",
    }


def test_get_workflow_has_powerwash_merged(client_for):
    response = client_for("development").get("/api/workflows/chromebook_frozen")
    assert response.status_code == 200
    body = response.json()
    ids = [s["id"] for s in body["steps"]]
    assert ids[-5:] == [
        "powerwash_intro",
        "powerwash_backup",
        "powerwash_ready",
        "powerwash_run",
        "powerwash_signin",
    ]
    assert ids.count("powerwash_intro") == 1
    run = next(s for s in body["steps"] if s["id"] == "powerwash_run")
    assert run["warning_level"] == "data_loss"


def test_get_workflow_leaves_out_empty_fields(client_for):
    """Steps without a warning have no "warning" key, not "warning": null."""
    body = client_for("development").get("/api/workflows/chromebook_frozen").json()
    close_app = next(s for s in body["steps"] if s["id"] == "close_app")
    assert "warning" not in close_app
    assert "warning_level" not in close_app


def test_workflow_without_powerwash_is_unchanged(client_for):
    body = client_for("development").get("/api/workflows/cant_sign_in").json()
    assert not any(s["id"].startswith("powerwash") for s in body["steps"])


def test_unknown_workflow_is_404(client_for):
    response = client_for("development").get("/api/workflows/not_a_workflow")
    assert response.status_code == 404
    assert response.json() == {"detail": "Workflow not found"}


def test_invalid_id_is_rejected(client_for):
    assert client_for("development").get("/api/workflows/Bad-ID!").status_code == 422


# ---- Draft / approved / published ------------------------------------------


def test_production_hides_drafts(client_for):
    client = client_for("production")
    assert client.get("/api/health").json()["workflows_served"] == 0
    groups = client.get("/api/workflows").json()["categories"]
    assert all(group["workflows"] == [] for group in groups)
    assert client.get("/api/workflows/chromebook_frozen").status_code == 404


def test_demo_shows_drafts(client_for):
    assert client_for("demo").get("/api/workflows/chromebook_frozen").status_code == 200


def test_production_shows_approved_published_workflows(client_for, tmp_path):
    kb = write_kb(
        tmp_path,
        [workflow("approved_one", "approved"), workflow("draft_one", "draft")],
        published=["approved_one", "draft_one"],
    )
    client = client_for("production", kb)
    listed = client.get("/api/workflows").json()["categories"][0]["workflows"]
    assert [w["id"] for w in listed] == ["approved_one"]
    assert client.get("/api/workflows/approved_one").status_code == 200
    assert client.get("/api/workflows/draft_one").status_code == 404


def test_unpublished_workflow_is_never_served(client_for, tmp_path):
    kb = write_kb(tmp_path, [workflow("unlisted", "approved")], published=[])
    client = client_for("development", kb)
    assert client.get("/api/workflows/unlisted").status_code == 404
    assert client.get("/api/health").json()["workflows_served"] == 0


def test_approved_workflow_with_draft_powerwash_stays_hidden(client_for, tmp_path):
    """Approving a workflow is not enough if the Powerwash steps it includes are a draft."""
    wf = workflow("needs_powerwash", "approved", includes=["powerwash"])
    wf["steps"][1]["no"] = "powerwash_intro"
    kb = write_kb(tmp_path, [wf], ["needs_powerwash"], procedures=[procedure("draft")])
    assert client_for("production", kb).get("/api/workflows/needs_powerwash").status_code == 404

    (tmp_path / "shared" / "powerwash.json").write_text(json.dumps(procedure("approved")))
    body = client_for("production", kb).get("/api/workflows/needs_powerwash").json()
    assert body["review_status"] == "approved"
