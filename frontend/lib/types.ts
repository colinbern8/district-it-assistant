/**
 * Shared types for troubleshooting workflows.
 *
 * These mirror the JSON files in data/workflows/ exactly (including the
 * snake_case property names), so the JSON can be used without conversion.
 * The Python backend in Phase 2 will use the same field names.
 */

/** Special targets that end a workflow instead of pointing to another step. */
export const OUTCOME_RESOLVED = "RESOLVED";
export const OUTCOME_ESCALATE = "ESCALATE";

export type Outcome = typeof OUTCOME_RESOLVED | typeof OUTCOME_ESCALATE;

export type Answer = "yes" | "no";

export interface WorkflowStep {
  /** Unique within the workflow, e.g. "restart". */
  id: string;
  /** Short heading shown above the instructions. */
  title: string;
  /** Numbered actions the user performs. */
  instructions: string[];
  /** Optional caution shown before the question. */
  warning?: string;
  /** The Yes/No question asked after the instructions. */
  question: string;
  /** Where "Yes" goes: another step's id, "RESOLVED", or "ESCALATE". */
  yes: string;
  /** Where "No" goes: another step's id, "RESOLVED", or "ESCALATE". */
  no: string;
}

export interface Workflow {
  id: string;
  version: number;
  title: string;
  summary: string;
  estimated_minutes: number;
  start_step: string;
  steps: WorkflowStep[];
}
