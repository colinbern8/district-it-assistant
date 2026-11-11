/**
 * Shared types for troubleshooting workflows.
 *
 * These mirror the JSON returned by the FastAPI backend (see
 * backend/models.py), including the snake_case property names. The backend
 * loads and validates all content; the frontend trusts its responses.
 */

// ---------------------------------------------------------------------------
// Outcomes: special targets that END a workflow instead of pointing to a step.
// ---------------------------------------------------------------------------

/** The student fixed it. */
export const OUTCOME_RESOLVED = "RESOLVED";
/** Needs a technician: go to the school office (existing Zoom process). */
export const OUTCOME_ESCALATE = "ESCALATE";
/** Physical damage: stop troubleshooting, take it to the school office. */
export const OUTCOME_ESCALATE_DAMAGE = "ESCALATE_DAMAGE";
/** Battery hazard (swelling, heat, smoke, burning smell): stop using it now. */
export const OUTCOME_ESCALATE_SAFETY = "ESCALATE_SAFETY";

export const OUTCOMES = [
  OUTCOME_RESOLVED,
  OUTCOME_ESCALATE,
  OUTCOME_ESCALATE_DAMAGE,
  OUTCOME_ESCALATE_SAFETY,
] as const;

export type Outcome = (typeof OUTCOMES)[number];

/** Outcomes that stop troubleshooting for safety reasons (no Back button). */
export const STOP_OUTCOMES: readonly Outcome[] = [
  OUTCOME_ESCALATE_DAMAGE,
  OUTCOME_ESCALATE_SAFETY,
];

/** "draft" until a district technician approves it. Drafts show a banner. */
export type ReviewStatus = "draft" | "approved";

/** "caution" = yellow box. "data_loss" = red box, used for Powerwash. */
export type WarningLevel = "caution" | "data_loss";

export type Answer = "yes" | "no";

export interface WorkflowStep {
  /** Unique within the workflow, e.g. "restart". */
  id: string;
  /** Short heading shown above the instructions. */
  title: string;
  /** Numbered actions the user performs. */
  instructions: string[];
  /** Optional warning shown above the instructions. */
  warning?: string;
  /** How serious the warning is. Defaults to "caution". */
  warning_level?: WarningLevel;
  /** The Yes/No question asked after the instructions. */
  question: string;
  /** Where "Yes" goes: another step's id, or one of the OUTCOMES. */
  yes: string;
  /** Where "No" goes: another step's id, or one of the OUTCOMES. */
  no: string;
}

export interface Workflow {
  id: string;
  version: number;
  /** A category id from knowledge_base/catalog.json, e.g. "power_startup". */
  category: string;
  review_status: ReviewStatus;
  title: string;
  summary: string;
  estimated_minutes: number;
  start_step: string;
  /** Shared procedures (e.g. "powerwash") the backend already merged into steps. */
  includes?: string[];
  steps: WorkflowStep[];
}

/** One home-page card, from GET /api/workflows. */
export interface WorkflowSummary {
  id: string;
  title: string;
  summary: string;
  category: string;
  estimated_minutes: number;
  review_status: ReviewStatus;
}

/** A category and its visible workflows, in catalog order. */
export interface CategoryGroup {
  id: string;
  label: string;
  workflows: WorkflowSummary[];
}
