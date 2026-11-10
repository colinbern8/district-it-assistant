/**
 * The workflow engine: pure functions that decide "what happens next".
 *
 * Nothing in this file touches React or the screen. Each function takes the
 * current state and returns a NEW state object (it never edits the old one).
 * That makes the logic easy to unit test and easy to reuse later, for example
 * when we add session logging in a later phase.
 *
 * Checking workflow CONTENT for mistakes (broken links, loops, safety rules)
 * is the backend's job: see backend/services/knowledge_base.py and tests/.
 */
import {
  OUTCOME_ESCALATE_DAMAGE,
  OUTCOMES,
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
