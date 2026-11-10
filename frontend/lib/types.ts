/**
 * Shared types for troubleshooting workflows.
 *
 * These mirror the JSON files in data/ exactly (including the snake_case
 * property names), so the JSON can be used without conversion. The Python
 * backend in Phase 2 will use the same field names.
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

// ---------------------------------------------------------------------------
// Categories, in the order they appear on the home page.
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { id: "power_startup", label: "Power and startup" },
  { id: "wifi_connectivity", label: "Wi-Fi and connectivity" },
  { id: "audio_camera_mic", label: "Audio, camera, and microphone" },
  { id: "browser_apps", label: "Browser and applications" },
  { id: "login_account", label: "Login and account access" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

// ---------------------------------------------------------------------------
// Review status: every file stays "draft" until a district technician
// approves it. Drafts show a banner in the app.
// ---------------------------------------------------------------------------

export const REVIEW_STATUSES = ["draft", "approved"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** "caution" = yellow box. "data_loss" = red box, used for Powerwash. */
export const WARNING_LEVELS = ["caution", "data_loss"] as const;
export type WarningLevel = (typeof WARNING_LEVELS)[number];

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

/** A reusable set of steps (e.g. Powerwash) that workflows can include. */
export interface SharedProcedure {
  id: string;
  review_status: ReviewStatus;
  /** The step id that workflows point to in order to start this procedure. */
  entry_step: string;
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  version: number;
  category: CategoryId;
  review_status: ReviewStatus;
  title: string;
  summary: string;
  estimated_minutes: number;
  start_step: string;
  /** Ids of shared procedures whose steps get added to this workflow. */
  includes?: string[];
  steps: WorkflowStep[];
}
