import { describe, expect, it } from "vitest";
import type { Workflow } from "./types";
import { getAllWorkflows } from "./workflows";
import {
  answerStep,
  goBack,
  startSession,
  validateWorkflow,
} from "./workflowEngine";

// A tiny made-up workflow, so these tests don't break when real content changes.
const sample: Workflow = {
  id: "sample",
  version: 1,
  title: "Sample",
  summary: "Test workflow",
  estimated_minutes: 1,
  start_step: "a",
  steps: [
    { id: "a", title: "A", instructions: ["Do A"], question: "Damaged?", yes: "ESCALATE", no: "b" },
    { id: "b", title: "B", instructions: ["Do B"], question: "Fixed?", yes: "RESOLVED", no: "ESCALATE" },
  ],
};

describe("session navigation", () => {
  it("starts on the start step with no answers", () => {
    expect(startSession(sample)).toEqual({
      currentStepId: "a",
      answers: [],
      outcome: null,
    });
  });

  it("moves to the next step when the answer points to a step", () => {
    const state = answerStep(startSession(sample), sample, "no");
    expect(state.currentStepId).toBe("b");
    expect(state.answers).toEqual([{ stepId: "a", answer: "no" }]);
  });

  it("finishes as RESOLVED", () => {
    let state = answerStep(startSession(sample), sample, "no");
    state = answerStep(state, sample, "yes");
    expect(state).toMatchObject({ currentStepId: null, outcome: "RESOLVED" });
  });

  it("finishes as ESCALATE straight from the first step", () => {
    const state = answerStep(startSession(sample), sample, "yes");
    expect(state).toMatchObject({ currentStepId: null, outcome: "ESCALATE" });
  });

  it("ignores answers after the session has finished", () => {
    const done = answerStep(startSession(sample), sample, "yes");
    expect(answerStep(done, sample, "no")).toBe(done);
  });

  it("goes back from an outcome to the last step answered", () => {
    let state = answerStep(startSession(sample), sample, "no");
    state = answerStep(state, sample, "no");
    state = goBack(state);
    expect(state).toEqual({
      currentStepId: "b",
      answers: [{ stepId: "a", answer: "no" }],
      outcome: null,
    });
  });

  it("does nothing when going back from the first step", () => {
    const start = startSession(sample);
    expect(goBack(start)).toBe(start);
  });
});

describe("validateWorkflow", () => {
  it("accepts a valid workflow", () => {
    expect(validateWorkflow(sample)).toEqual([]);
  });

  it("reports a target that points nowhere", () => {
    const broken = structuredClone(sample);
    broken.steps[1].no = "missing_step";
    expect(validateWorkflow(broken)).toContain(
      'Step "b" points to unknown target "missing_step"',
    );
  });

  it("reports a missing start step", () => {
    const broken = { ...sample, start_step: "nope" };
    expect(validateWorkflow(broken)).toEqual([
      'start_step "nope" is not a step',
    ]);
  });

  it("reports unreachable steps", () => {
    const broken = structuredClone(sample);
    broken.steps.push({ id: "c", title: "C", instructions: [], question: "?", yes: "RESOLVED", no: "RESOLVED" });
    expect(validateWorkflow(broken)).toContain('Step "c" can never be reached');
  });

  it("reports loops", () => {
    const broken = structuredClone(sample);
    broken.steps[1].no = "a";
    expect(validateWorkflow(broken)).toContain(
      'Loop detected: step "a" can lead back to itself',
    );
  });
});

// This is the test that protects real content: every workflow file we ship
// must pass validation, so a typo in a JSON file fails the test run.
describe("bundled workflows", () => {
  it.each(getAllWorkflows().map((w) => [w.id, w] as const))(
    "%s is valid",
    (_id, workflow) => {
      expect(validateWorkflow(workflow)).toEqual([]);
    },
  );
});
