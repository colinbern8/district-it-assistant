/**
 * The workflow engine: pure functions that decide "what happens next".
 *
 * Nothing in this file touches React or the screen. Each function takes the
 * current state and returns a NEW state object (it never edits the old one).
 * That makes the logic easy to unit test and easy to reuse later, for example
 * when we add session logging in a later phase.
 */
import {
  CATEGORIES,
  OUTCOME_ESCALATE_DAMAGE,
  OUTCOMES,
  REVIEW_STATUSES,
  WARNING_LEVELS,
  type Answer,
  type Outcome,
  type Workflow,
  type WorkflowStep,
} from "./types";

/** One answered question, kept so we can go Back and show what was tried. */
export interface AnsweredStep {
  stepId: string;
  answer: Answer;
}

/** Everything we need to know about one troubleshooting session. */
export interface SessionState {
  /** The step on screen now, or null once the session has an outcome. */
  currentStepId: string | null;
  /** Every answer so far, oldest first. */
  answers: AnsweredStep[];
  /** Set when the workflow finishes. */
  outcome: Outcome | null;
}

export function isOutcome(target: string): target is Outcome {
  return (OUTCOMES as readonly string[]).includes(target);
}

/** Find a step by id. Throws if it is missing, because that is a data bug. */
export function getStep(workflow: Workflow, stepId: string): WorkflowStep {
  const step = workflow.steps.find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`Workflow "${workflow.id}" has no step "${stepId}"`);
  }
  return step;
}

export function startSession(workflow: Workflow): SessionState {
  return { currentStepId: workflow.start_step, answers: [], outcome: null };
}

/** Record a Yes/No answer and move to the next step or to an outcome. */
export function answerStep(
  state: SessionState,
  workflow: Workflow,
  answer: Answer,
): SessionState {
  if (state.currentStepId === null) {
    return state; // Already finished; ignore extra clicks.
  }

  const step = getStep(workflow, state.currentStepId);
  const target = answer === "yes" ? step.yes : step.no;
  const answers = [...state.answers, { stepId: step.id, answer }];

  if (isOutcome(target)) {
    return { currentStepId: null, answers, outcome: target };
  }
  return { currentStepId: target, answers, outcome: null };
}

/** Undo the most recent answer and return to the step it was given on. */
export function goBack(state: SessionState): SessionState {
  const last = state.answers.at(-1);
  if (!last) {
    return state; // Already on the first step.
  }
  return {
    currentStepId: last.stepId,
    answers: state.answers.slice(0, -1),
    outcome: null,
  };
}

/**
 * The student pressed "My Chromebook is damaged". Stop troubleshooting
 * immediately, from any step, and keep the answers given so far.
 */
export function reportDamage(state: SessionState): SessionState {
  return { ...state, currentStepId: null, outcome: OUTCOME_ESCALATE_DAMAGE };
}

/**
 * Check a workflow for authoring mistakes. Returns a list of problems;
 * an empty list means the workflow is valid.
 *
 * Checks: allowed values for category / review_status / warning_level,
 * duplicate step ids, a missing start step, Yes/No targets that point
 * nowhere, steps nobody can reach, and loops that could trap a user.
 */
export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  // JSON files can contain any string, so check the fixed lists at runtime.
  if (!CATEGORIES.some((c) => c.id === workflow.category)) {
    errors.push(`Unknown category "${workflow.category}"`);
  }
  if (!REVIEW_STATUSES.includes(workflow.review_status)) {
    errors.push(`Unknown review_status "${workflow.review_status}"`);
  }
  for (const step of workflow.steps) {
    if (step.warning_level && !WARNING_LEVELS.includes(step.warning_level)) {
      errors.push(`Step "${step.id}" has unknown warning_level "${step.warning_level}"`);
    }
  }

  for (const step of workflow.steps) {
    if (ids.has(step.id)) errors.push(`Duplicate step id "${step.id}"`);
    ids.add(step.id);
  }

  if (!ids.has(workflow.start_step)) {
    errors.push(`start_step "${workflow.start_step}" is not a step`);
    return errors; // The checks below need a valid start.
  }

  for (const step of workflow.steps) {
    for (const target of [step.yes, step.no]) {
      if (!isOutcome(target) && !ids.has(target)) {
        errors.push(`Step "${step.id}" points to unknown target "${target}"`);
      }
    }
  }
  if (errors.length > 0) return errors;

  // Walk every path from the start step (depth-first search).
  // "visiting" holds the steps on the current path, so seeing one of them
  // again means the path loops back on itself.
  const reached = new Set<string>();
  const visiting = new Set<string>();

  const walk = (stepId: string) => {
    if (visiting.has(stepId)) {
      errors.push(`Loop detected: step "${stepId}" can lead back to itself`);
      return;
    }
    if (reached.has(stepId)) return;

    reached.add(stepId);
    visiting.add(stepId);
    const step = getStep(workflow, stepId);
    for (const target of [step.yes, step.no]) {
      if (!isOutcome(target)) walk(target);
    }
    visiting.delete(stepId);
  };
  walk(workflow.start_step);

  for (const id of ids) {
    if (!reached.has(id)) errors.push(`Step "${id}" can never be reached`);
  }
  return errors;
}
