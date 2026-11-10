import { describe, expect, it } from "vitest";
import type { Workflow } from "./types";
import { getAllWorkflows, getSharedProcedure, withSharedSteps } from "./workflows";
import {
  answerStep,
  getStep,
  goBack,
  reportDamage,
  startSession,
  validateWorkflow,
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

describe("damage and safety", () => {
  it("reportDamage stops the session from any step and keeps the answers", () => {
    const midway = answerStep(startSession(sample), sample, "no");
    expect(reportDamage(midway)).toEqual({
      currentStepId: null,
      answers: [{ stepId: "a", answer: "no" }],
      outcome: "ESCALATE_DAMAGE",
    });
  });

  it("accepts the new outcomes as targets", () => {
    const wf = structuredClone(sample);
    wf.steps[0].yes = "ESCALATE_SAFETY";
    wf.steps[1].no = "ESCALATE_DAMAGE";
    expect(validateWorkflow(wf)).toEqual([]);
    expect(answerStep(startSession(wf), wf, "yes").outcome).toBe("ESCALATE_SAFETY");
  });

  it("reports unknown category, review status, and warning level", () => {
    const broken = structuredClone(sample) as unknown as Record<string, unknown>;
    broken.category = "printers";
    broken.review_status = "maybe";
    (broken.steps as Record<string, unknown>[])[0].warning_level = "scary";
    expect(validateWorkflow(broken as unknown as Workflow)).toEqual([
      'Unknown category "printers"',
      'Unknown review_status "maybe"',
      'Step "a" has unknown warning_level "scary"',
    ]);
  });
});

describe("shared procedures", () => {
  it("adds included steps and keeps the workflow draft if any part is draft", () => {
    const merged = withSharedSteps({
      ...sample,
      review_status: "approved",
      includes: ["powerwash"],
    });
    expect(merged.steps.some((s) => s.id === "powerwash_intro")).toBe(true);
    expect(merged.review_status).toBe("draft"); // Powerwash is still a draft.
  });

  it("throws for an unknown procedure", () => {
    expect(() => withSharedSteps({ ...sample, includes: ["nope"] })).toThrow(
      'includes unknown procedure "nope"',
    );
  });
});

// Safety rules from docs/safety_rules.md, checked against the real content.
describe("safety rules for bundled workflows", () => {
  const workflows = getAllWorkflows();
  const powerwash = getSharedProcedure("powerwash")!;
  const powerwashIds = new Set(powerwash.steps.map((s) => s.id));

  it.each(workflows.filter((w) => w.category === "power_startup").map((w) => [w.id, w] as const))(
    "%s starts with a safety check, then a damage check",
    (_id, workflow) => {
      const safety = getStep(workflow, workflow.start_step);
      expect(safety.yes).toBe("ESCALATE_SAFETY");
      expect(getStep(workflow, safety.no).yes).toBe("ESCALATE_DAMAGE");
    },
  );

  it.each(workflows.map((w) => [w.id, w] as const))(
    "%s never starts with Powerwash",
    (_id, workflow) => {
      expect(powerwashIds.has(workflow.start_step)).toBe(false);
    },
  );

  it("Powerwash is only offered by the three approved workflows", () => {
    const offering = workflows
      .filter((w) => w.steps.some((s) => s.yes === powerwash.entry_step || s.no === powerwash.entry_step))
      .map((w) => w.id)
      .sort();
    expect(offering).toEqual([
      "chromebook_frozen",
      "chromebook_running_slow",
      "website_or_app_problem",
    ]);
  });

  it("the Powerwash procedure is flagged for technician review and warns about data loss", () => {
    expect(powerwash.review_status).toBe("draft");
    const runStep = powerwash.steps.find((s) => s.id === "powerwash_run");
    expect(runStep?.warning_level).toBe("data_loss");
  });
});
