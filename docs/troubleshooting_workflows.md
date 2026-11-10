# Troubleshooting workflow format

Each workflow is one JSON file that describes a Yes/No decision tree.

## Example

```json
{
  "id": "chromebook_frozen",
  "version": 1,
  "title": "My Chromebook is frozen",
  "summary": "The screen is stuck, or the Chromebook won't respond.",
  "estimated_minutes": 10,
  "start_step": "check_damage",
  "steps": [
    {
      "id": "check_damage",
      "title": "Check for damage first",
      "instructions": ["Look closely at your Chromebook."],
      "question": "Do you see any damage?",
      "yes": "ESCALATE",
      "no": "restart"
    }
  ]
}
```

## Fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique id, also used in the URL: `/troubleshoot/<id>` |
| `version` | yes | Increase this when you change the content |
| `title` | yes | How users describe the problem, in their words |
| `summary` | yes | One sentence shown on the home page |
| `estimated_minutes` | yes | Rough time to complete every step |
| `start_step` | yes | `id` of the first step |
| `steps[].id` | yes | Unique within this workflow |
| `steps[].title` | yes | Short heading |
| `steps[].instructions` | yes | List of actions, shown numbered |
| `steps[].warning` | no | Caution shown before the instructions |
| `steps[].question` | yes | The Yes/No question |
| `steps[].yes` / `steps[].no` | yes | Another step's `id`, `"RESOLVED"`, or `"ESCALATE"` |

## Writing rules

1. **Damage check first.** Physical damage belongs to technicians, so every
   hardware workflow should send "Yes, it's damaged" straight to `ESCALATE`.
2. **Least risky step first.** Close an app → restart → charge → reset.
3. **Never instruct a Powerwash.** That is a technician decision.
4. **Plain language.** Write for an elementary-school reader: short sentences,
   name the physical key ("the circle arrow key"), one action per line.
5. **Every path must end** in `RESOLVED` or `ESCALATE`, with no loops.
   `npm test` checks this automatically for every bundled workflow.
