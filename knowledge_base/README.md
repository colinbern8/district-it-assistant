# Knowledge base

All troubleshooting content. The FastAPI backend loads, merges, and validates
these files at startup; if anything is wrong, it refuses to start and lists
every problem.

```
knowledge_base/
├── catalog.json        Categories, their labels, and which workflows are
│                       published, in the order students see them
├── workflows/*.json    One file per workflow; the file name must equal its "id"
└── shared/*.json       Shared procedures (Powerwash), included by workflows
```

- **Publish** a workflow by listing its id in `catalog.json`.
- **Approve** a workflow by setting `"review_status": "approved"` after
  technician review. In production (`APP_ENV=production`) only approved
  workflows are shown.

File format: `../docs/troubleshooting_workflows.md`.
Safety rules: `../docs/safety_rules.md`.
After editing, run `.venv/bin/pytest` from the project root.
