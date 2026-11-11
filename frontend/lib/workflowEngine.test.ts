/**
 * Tests for NAVIGATION: how answers move a student through a workflow.
 *
 * Tests for workflow CONTENT (broken links, loops, Powerwash merging, and the
 * safety rules) live with the backend in tests/*.py, because the backend is
 * now the single source of truth for loading and validating workflows.
 */
import { describe, expect, it } from "vitest";
import type { Workflow } from "./types";
import {
  answerStep,
  getStep,
  goBack,
  isOutcome,
  reportDamage,
  startSession,
} from "./workflowEngine";

// A tiny made-up workflow, so these tests don't break when real content changes.
const sample: Workflow = {
  id: "sample",
  version: 1,
  category: "power_startup",
  review_status: "draft",
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

describe("damage and safety outcomes", () => {
  it("reportDamage stops the session from any step and keeps the answers", () => {
    const midway = answerStep(startSession(sample), sample, "no");
    expect(reportDamage(midway)).toEqual({
      currentStepId: null,
      answers: [{ stepId: "a", answer: "no" }],
      outcome: "ESCALATE_DAMAGE",
    });
  });

  it("finishes with ESCALATE_SAFETY and ESCALATE_DAMAGE when a step points to them", () => {
    const wf = structuredClone(sample);
    wf.steps[0].yes = "ESCALATE_SAFETY";
    wf.steps[1].yes = "ESCALATE_DAMAGE";
    expect(answerStep(startSession(wf), wf, "yes").outcome).toBe("ESCALATE_SAFETY");
    const atB = answerStep(startSession(wf), wf, "no");
    expect(answerStep(atB, wf, "yes").outcome).toBe("ESCALATE_DAMAGE");
  });

  it("going back after a damage report returns to the last answered step", () => {
    const midway = answerStep(startSession(sample), sample, "no");
    expect(goBack(reportDamage(midway))).toMatchObject({ currentStepId: "a", outcome: null });
  });
});

describe("helpers", () => {
  it("isOutcome recognizes all four outcomes and nothing else", () => {
    for (const target of ["RESOLVED", "ESCALATE", "ESCALATE_DAMAGE", "ESCALATE_SAFETY"]) {
      expect(isOutcome(target)).toBe(true);
    }
    expect(isOutcome("restart")).toBe(false);
  });

  it("getStep finds a step and throws for a missing one", () => {
    expect(getStep(sample, "b").title).toBe("B");
    expect(() => getStep(sample, "zzz")).toThrow('Workflow "sample" has no step "zzz"');
  });
});
