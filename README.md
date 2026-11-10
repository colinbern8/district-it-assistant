# District IT Self-Service Assistant (proof of concept)

Helps students fix simple Chromebook problems themselves, step by step. Anything it can't fix goes to the existing
school office → Zoom technician process.

**Privacy:** this proof of concept doesn't connect to district systems,
doesn't ask for student information, and has no text inputs.

**Review required:** all troubleshooting content is a draft until a district
technician reviews it. See [`docs/safety_rules.md`](docs/safety_rules.md).

## Project layout

```
district-it-assistant/
├── frontend/          Next.js + React app (Phase 1)
├── backend/           FastAPI service (Phase 2)
├── knowledge_base/    Workflow JSON files (Phase 2)
├── tests/             Backend tests (Phase 2)
└── docs/              Architecture and workflow format
```

## Requirements

- Node.js 20.9 or newer (`node --version`)

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

## Check the code

```bash
cd frontend
npm test        # unit tests for the workflow engine and workflow files
npm run lint    # code style
npm run build   # production build (also type checks)
```

See `docs/architecture.md` for how the pieces fit together,
`docs/troubleshooting_workflows.md` for the workflow format, and
`docs/safety_rules.md` for the safety rules and technician review checklist.
