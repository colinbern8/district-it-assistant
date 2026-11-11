# Architecture

## Phase 2 (current): Next.js frontend + FastAPI backend

```
 Student's browser
       │  only ever talks to Next.js
       ▼
 Next.js server (frontend/, port 3000)
   ├─ app/page.tsx ───────────────────► GET /api/workflows        ┐
   ├─ app/troubleshoot/[workflowId] ──► GET /api/workflows/{id}   │ server-to-server,
   │     └─ TroubleshootingWizard ("use client", unchanged)       │ uncached, 5 s timeout
   ├─ app/damaged/page.tsx  (fully static: never calls the API)   │
   └─ lib/workflows.ts  (API client)                              ▼
                                         FastAPI (backend/, port 8000)
                                           ├─ main.py           app + /api/health
                                           ├─ routes/workflows.py
                                           ├─ services/knowledge_base.py
                                           │    load → merge Powerwash → validate
                                           └─ models.py         Pydantic shapes
                                                   │
                                                   ▼
                                         knowledge_base/
                                           ├─ catalog.json   order + publication
                                           ├─ workflows/*.json
                                           └─ shared/powerwash.json
```

### Who does what

| Job | Where |
|---|---|
| Store workflow content | `knowledge_base/` |
| Decide order and what is published | `knowledge_base/catalog.json` |
| Load, merge shared steps, validate | `backend/services/knowledge_base.py` (single source of truth) |
| Hide drafts in production | `backend/settings.py` (`APP_ENV`) + `KnowledgeBase.is_visible()` |
| Check content and safety rules | `tests/` (pytest) |
| Navigation (answer, back, damage) | `frontend/lib/workflowEngine.ts` (tested with Vitest) |
| Screens | `frontend/components/` |

### Draft, approved, and published

| Term | Set where | Meaning |
|---|---|---|
| **Draft** | `"review_status": "draft"` in the file | Not yet reviewed by a technician |
| **Approved** | `"review_status": "approved"` | Reviewed. A workflow only counts as approved if every shared procedure it includes (e.g. Powerwash) is approved too. |
| **Published** | Listed in `catalog.json` | Intended to appear in the app |
| **Visible** | Computed | Published **and** (approved, **or** `APP_ENV` is `development`/`demo`) |

In production, a hidden workflow returns the same 404 as one that doesn't exist.

### What happens on one page visit

1. The browser asks Next.js for `/troubleshoot/chromebook_frozen`.
2. Next.js immediately sends the prerendered shell: header, footer, and a gray
   loading placeholder. This shell needs no URL data and no API, so it is instant.
3. Inside `<Suspense>`, `WorkflowContent` reads `params`, then calls
   `getWorkflow("chromebook_frozen")`, which makes one uncached `fetch` to FastAPI.
4. FastAPI returns the workflow with the Powerwash steps already merged in.
5. Next.js streams the finished `TroubleshootingWizard` into the page, replacing
   the placeholder. From here on, every Yes/No click happens in the browser.

### When the backend fails

| Problem | What the student sees |
|---|---|
| Backend not running | "Troubleshooting is not available right now. Go to your school office…" |
| Backend too slow (over `API_TIMEOUT_MS`) | Same message, after the timeout |
| Backend returns an error | Same message |
| Workflow unknown, or a draft in production | "We couldn't find that help topic" |

The header, the "Damaged, lost, or stolen?" card, and the `/damaged` page are
outside the API-dependent parts, so they always work.

### Why `<Suspense>` around `params`

With Partial Prefetching, clicking a link first shows a prerendered **App
Shell** that is shared by every URL of that route. Anything that reads the URL
(`params`) can't be in that shell. Reading `params` at the top of the page made
the whole page URL-dependent, so Next.js warned that navigation couldn't be
instant. Moving the `params` read (and the API call) inside `<Suspense>` lets
the shell, with the placeholder, be prerendered and shown instantly.

### Design decisions

| Decision | Why |
|---|---|
| The browser never calls FastAPI | No CORS setup, no public API address, and the wizard stays unchanged. |
| Uncached, request-time API calls | Content edits appear immediately, and `next build` doesn't need the backend. Fine at district scale; caching can be added later. |
| React `cache()` on `getWorkflow` | The page title and the page content share one API call per visit. |
| Backend validates everything at startup | A broken file stops the server instead of reaching a student. |
| `APP_ENV` defaults to `production` | Forgetting to set it hides drafts instead of exposing them. |
| Workflow logic lives in plain functions, not in components | Testable without a browser. |
| Workflows are data (JSON), not code | Content can change without code changes. |
| JSON uses `snake_case` | Matches Python, so no renaming between layers. |
| Separate outcomes for damage and battery hazards | Each needs different instructions, and both stop troubleshooting. |
| Powerwash lives in one shared file | The technician reviews one copy. |
| The assistant only points to the school office | Tickets, loaners, and damage reports stay with technicians (GoGuardian). |
| No text inputs anywhere | Nobody can type student information into the app. |

## Phases

| Phase | Adds |
|---|---|
| 1 | Next.js interface + one workflow |
| 1.5 | 8 student Chromebook workflows, safety rules, Powerwash procedure |
| 2 | FastAPI backend, shared `knowledge_base/`, Codespaces (this phase) |
| Later | Wi-Fi workflows (district process), session logging, optional AI classification, Google sign-in |
