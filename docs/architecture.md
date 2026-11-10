# Architecture

## Phase 1 (current): frontend only

```
Browser
  │
  ▼
Next.js app (frontend/)
  ├── app/page.tsx ─────────────── Home: list of help topics
  ├── app/troubleshoot/[workflowId]/page.tsx
  │       Server component. Looks up the workflow by id, then renders:
  │       └── components/TroubleshootingWizard.tsx  ("use client")
  │             Holds the session state. Shows one of:
  │             ├── StepView        (instructions + Yes/No)
  │             ├── ResolvedView    (outcome RESOLVED)
  │             └── EscalationView  (outcome ESCALATE → school office / Zoom)
  │
  ├── lib/workflowEngine.ts ── Pure logic: start, answer, back, validate
  ├── lib/workflows.ts ─────── Where workflows come from (only file that changes in Phase 2)
  └── data/workflows/*.json ── Workflow content
```

### Data flow for one click

1. The user clicks **No** in `StepView`.
2. `StepView` calls `onAnswer("no")`, a function passed in by `TroubleshootingWizard`.
3. The wizard calls `answerStep(currentState, workflow, "no")` from the engine.
4. The engine looks up the step's `no` target. A step id moves to that step;
   `RESOLVED` or `ESCALATE` ends the session.
5. The wizard stores the new state, and React re-renders the matching view.

### Design decisions

| Decision | Why |
|---|---|
| Workflow logic lives in plain functions, not in components | It can be unit tested without a browser, and logging (Phase 4) can hook in at one place. |
| Workflows are data (JSON), not code | Non-programmers can edit content, and the same files can be served by the Python backend later. |
| JSON uses `snake_case` | It matches Python and Firestore conventions, so no field renaming is needed between layers. |
| Escalation shows what the user already tried | The Zoom technician doesn't repeat steps, which shortens sessions. |
| No text inputs anywhere | Nobody can type student information into the app by accident. |

## Planned phases

| Phase | Adds |
|---|---|
| 1 | Next.js interface + one workflow (this phase) |
| 2 | FastAPI backend serving workflows from `knowledge_base/` |
| 3 | The five Chromebook workflows |
| 4 | Session logging and resolution tracking (Firestore) |
| 5 | Optional Gemini classification ("describe your problem") |
| 6 | Google Workspace sign-in |
