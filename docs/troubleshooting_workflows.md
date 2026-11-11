# Troubleshooting workflow format

Each workflow is one JSON file in `knowledge_base/workflows/` that describes a
Yes/No decision tree. The FastAPI backend loads and validates every file at
startup and serves them to the frontend. Safety rules that all content must follow are in
[`safety_rules.md`](safety_rules.md).

## Current workflows

| Category | Workflow id | Powerwash? |
|---|---|---|
| Power and startup | `chromebook_frozen` | Yes (last resort) |
| Power and startup | `chromebook_wont_turn_on` | No |
| Power and startup | `chromebook_not_charging` | No |
| Wi-Fi and connectivity | *(deferred: district Wi-Fi process to be documented)* | |
| Audio, camera, and microphone | `no_sound` | No |
| Audio, camera, and microphone | `camera_or_mic_not_working` | No |
| Browser and applications | `website_or_app_problem` | Yes (only if many apps fail) |
| Browser and applications | `chromebook_running_slow` | Yes (only if slow with one tab) |
| Login and account access | `cant_sign_in` | No |

## Example

```json
{
  "id": "chromebook_frozen",
  "version": 2,
  "category": "power_startup",
  "review_status": "draft",
  "title": "My Chromebook is frozen",
  "summary": "The screen is stuck, or the Chromebook won't respond.",
  "estimated_minutes": 10,
  "start_step": "check_safety",
  "includes": ["powerwash"],
  "steps": [
    {
      "id": "check_safety",
      "title": "Safety check first",
      "instructions": ["Check for bulging, heat, smoke, or a burning smell."],
      "question": "Do you notice any of these?",
      "yes": "ESCALATE_SAFETY",
      "no": "check_damage"
    }
  ]
}
```

## Workflow fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique id, also used in the URL: `/troubleshoot/<id>`. The file must be named `<id>.json`. |
| `version` | yes | Increase this when you change the content |
| `category` | yes | A category id from `catalog.json`: `power_startup`, `wifi_connectivity`, `audio_camera_mic`, `browser_apps`, or `login_account` |
| `review_status` | yes | `draft` until a district technician approves it, then `approved` |
| `title` | yes | How students describe the problem, in their words |
| `summary` | yes | One sentence shown on the home page |
| `estimated_minutes` | yes | Rough time to complete every step |
| `start_step` | yes | `id` of the first step |
| `includes` | no | Shared procedures to add, e.g. `["powerwash"]` |
| `steps` | yes | The steps (below) |

## Step fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique within this workflow (including included steps) |
| `title` | yes | Short heading |
| `instructions` | yes | List of actions, shown numbered |
| `warning` | no | Shown above the instructions |
| `warning_level` | no | `caution` (yellow, default) or `data_loss` (red, Powerwash only) |
| `question` | yes | The Yes/No question |
| `yes` / `no` | yes | Another step's `id`, or an outcome (below) |

## Outcomes

| Outcome | Screen |
|---|---|
| `RESOLVED` | "Great, your Chromebook is working!" |
| `ESCALATE` | Go to the school office for a Zoom technician; lists steps already tried |
| `ESCALATE_DAMAGE` | Stop. Physical damage; take it to the school office |
| `ESCALATE_SAFETY` | Stop using it now. Battery hazard; tell staff right away |

## Shared procedures

`knowledge_base/shared/powerwash.json` holds the Powerwash steps once, so the
technician reviews one copy. A workflow adds them with `"includes": ["powerwash"]`
and starts them by pointing a Yes/No answer at `"powerwash_intro"`. The backend
merges the steps in before serving the workflow.
If a shared procedure is `draft`, every workflow that includes it counts as draft.

## Publishing and approval

| | How | Effect |
|---|---|---|
| Publish | List the workflow id under its category in `knowledge_base/catalog.json` | It can appear in the app, in the listed order |
| Approve | Set `"review_status": "approved"` after technician review | It can appear in **production** |
| Unpublish | Remove it from `catalog.json` | Never served, but still validated |

`APP_ENV=development` or `demo` shows published drafts (with a Draft banner).
`APP_ENV=production` shows only published workflows that are approved,
including everything they include.

## Writing rules

1. **Safety, then damage, first** in every power workflow. `pytest` enforces this.
2. **Yes means "there's a problem"** on safety and damage questions, so habit-clicking No never skips a hazard.
3. **Least risky step first:** settings → close the app → restart → hardware reset → Powerwash.
4. **Powerwash only through the shared procedure**, never as a first step, and only in the three approved workflows.
5. **Never** Developer Mode, recovery, or getting around blocked sites or school settings.
6. **Plain language** for middle- and high-school students: short sentences, name the key by what it looks like, one action per line.
7. **No district-specific procedures.** Anything only the district can do (password resets, repairs, loaners) is `ESCALATE`.
8. **Every path must end** in an outcome, with no loops. The backend checks this at startup and in `pytest`.
