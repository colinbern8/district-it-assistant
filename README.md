# District IT Self-Service Assistant (proof of concept)

Helps students fix simple Chromebook problems themselves, step by step.
Anything it can't fix goes to the existing school office → Zoom technician
process.

**Privacy:** this proof of concept doesn't connect to district systems,
doesn't ask for student information, and has no text inputs.

**Review required:** all troubleshooting content is a draft until a district
technician reviews it. See [`docs/safety_rules.md`](docs/safety_rules.md).

## Project layout

```
district-it-assistant/
├── frontend/          Next.js + React app (what students use), port 3000
├── backend/           FastAPI service that serves the workflows, port 8000
├── knowledge_base/    Workflow content (JSON) + catalog.json
├── tests/             Backend tests (pytest): content, safety rules, API
├── scripts/dev.sh     Starts both servers
├── .devcontainer/     GitHub Codespaces setup
└── docs/              Architecture, workflow format, safety rules
```

## Run it in GitHub Codespaces (easiest)

1. On GitHub, open the repository → **Code** → **Codespaces** → **Create codespace**
   on the branch you want.
2. Wait for setup to finish. It installs Python 3.12, Node.js 22, and all
   packages automatically (`.devcontainer/setup.sh`).
3. In the terminal, run:

   ```bash
   ./scripts/dev.sh
   ```

4. Codespaces offers to open port **3000** (the app). Port **8000** is the API;
   open it from the **Ports** tab and add `/docs` to the address to try the API.

Press **Ctrl+C** in the terminal to stop both servers.

## Run it on your own computer

Requirements: **Python 3.12+** and **Node.js 20.9+**.

One-time setup, from the project root:

```bash
bash .devcontainer/setup.sh
```

Then start both servers:

```bash
./scripts/dev.sh
```

Or run each server in its own terminal, which shows their logs separately:

```bash
APP_ENV=development .venv/bin/python -m uvicorn backend.main:app --reload --reload-include '*.json' --port 8000
```

```bash
cd frontend && npm run dev
```

Open http://localhost:3000 for the app and http://localhost:8000/docs for the API.

## Settings

| Variable | Where | Default | Meaning |
|---|---|---|---|
| `APP_ENV` | backend | `production` | `development` or `demo` show **draft** workflows; `production` shows only **approved** ones |
| `KNOWLEDGE_BASE_DIR` | backend | `knowledge_base/` | Where the workflow files are |
| `API_BASE_URL` | frontend | `http://127.0.0.1:8000` | Where Next.js finds the API (server-side only) |
| `API_TIMEOUT_MS` | frontend | `5000` | How long to wait for the API before showing the "go to the school office" message |

The backend defaults to `production` on purpose: if someone forgets to set
`APP_ENV`, unreviewed content stays hidden. `scripts/dev.sh` and Codespaces set
`development` for you.

## Check the code

Backend, from the project root:

```bash
.venv/bin/pytest
```

```bash
.venv/bin/ruff check backend tests
```

Frontend, from `frontend/`:

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

The frontend build does not need the backend running.

See `docs/architecture.md` for how the pieces fit together,
`docs/troubleshooting_workflows.md` for the workflow format, and
`docs/safety_rules.md` for the safety rules and technician review checklist.
