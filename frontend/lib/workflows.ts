/**
 * Where the app gets its workflows from.
 *
 * Phase 1: workflows are JSON files bundled with the frontend.
 * Phase 2: this file will fetch them from the FastAPI backend instead.
 * Components only call these two functions, so only this file has to change.
 */
import chromebookFrozen from "../data/workflows/chromebook_frozen.json";
import type { Workflow } from "./types";

// Typing the array as Workflow[] makes TypeScript check each JSON file's shape.
const WORKFLOWS: Workflow[] = [chromebookFrozen];

export function getAllWorkflows(): Workflow[] {
  return WORKFLOWS;
}

export function getWorkflow(id: string): Workflow | undefined {
  return WORKFLOWS.find((workflow) => workflow.id === id);
}
