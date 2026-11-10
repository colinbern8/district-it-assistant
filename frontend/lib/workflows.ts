/**
 * Where the app gets its workflows from.
 *
 * Phase 1: workflows are JSON files bundled with the frontend.
 * Phase 2: this file will fetch them from the FastAPI backend instead.
 * Components only call the functions below, so only this file has to change.
 */
import powerwash from "../data/shared/powerwash.json";
import cameraOrMicNotWorking from "../data/workflows/camera_or_mic_not_working.json";
import cantSignIn from "../data/workflows/cant_sign_in.json";
import chromebookFrozen from "../data/workflows/chromebook_frozen.json";
import chromebookNotCharging from "../data/workflows/chromebook_not_charging.json";
import chromebookRunningSlow from "../data/workflows/chromebook_running_slow.json";
import chromebookWontTurnOn from "../data/workflows/chromebook_wont_turn_on.json";
import noSound from "../data/workflows/no_sound.json";
import websiteOrAppProblem from "../data/workflows/website_or_app_problem.json";
import {
  CATEGORIES,
  type CategoryId,
  type SharedProcedure,
  type Workflow,
} from "./types";

// JSON imports are typed loosely (e.g. "category" is just a string), so we
// tell TypeScript their real type here. validateWorkflow() checks the actual
// values at runtime, and the tests run it on every file.
const SHARED_PROCEDURES: Record<string, SharedProcedure> = {
  powerwash: powerwash as SharedProcedure,
};

const WORKFLOW_FILES = [
  chromebookFrozen,
  chromebookWontTurnOn,
  chromebookNotCharging,
  noSound,
  cameraOrMicNotWorking,
  websiteOrAppProblem,
  chromebookRunningSlow,
  cantSignIn,
] as Workflow[];

/**
 * Add the steps of every shared procedure a workflow "includes".
 * A workflow counts as approved only if it AND everything it includes are
 * approved, so an unreviewed Powerwash procedure keeps the draft banner on.
 */
export function withSharedSteps(workflow: Workflow): Workflow {
  const procedures = (workflow.includes ?? []).map((id) => {
    const procedure = SHARED_PROCEDURES[id];
    if (!procedure) {
      throw new Error(`Workflow "${workflow.id}" includes unknown procedure "${id}"`);
    }
    return procedure;
  });

  const allApproved = [workflow, ...procedures].every(
    (item) => item.review_status === "approved",
  );

  return {
    ...workflow,
    review_status: allApproved ? "approved" : "draft",
    steps: [...workflow.steps, ...procedures.flatMap((p) => p.steps)],
  };
}

const WORKFLOWS: Workflow[] = WORKFLOW_FILES.map(withSharedSteps);

export function getAllWorkflows(): Workflow[] {
  return WORKFLOWS;
}

export function getWorkflow(id: string): Workflow | undefined {
  return WORKFLOWS.find((workflow) => workflow.id === id);
}

export function getSharedProcedure(id: string): SharedProcedure | undefined {
  return SHARED_PROCEDURES[id];
}

/** Categories in display order, each with its workflows. Empty ones are skipped. */
export function getWorkflowsByCategory(): {
  id: CategoryId;
  label: string;
  workflows: Workflow[];
}[] {
  return CATEGORIES.map((category) => ({
    ...category,
    workflows: WORKFLOWS.filter((w) => w.category === category.id),
  })).filter((group) => group.workflows.length > 0);
}
