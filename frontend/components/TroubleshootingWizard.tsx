"use client";

/**
 * The interactive part of the app. It holds the session state and decides
 * which view to show. The actual "what comes next" logic lives in
 * lib/workflowEngine.ts; this component just calls it and re-renders.
 */
import { useEffect, useRef, useState } from "react";
import EscalationView from "@/components/EscalationView";
import ResolvedView from "@/components/ResolvedView";
import StepView from "@/components/StepView";
import type { Answer, Workflow } from "@/lib/types";
import {
  answerStep,
  getStep,
  goBack,
  startSession,
} from "@/lib/workflowEngine";

export default function TroubleshootingWizard({ workflow }: { workflow: Workflow }) {
  // The function form means startSession runs once, on the first render only.
  const [session, setSession] = useState(() => startSession(workflow));

  // After each click, move focus to the new heading so keyboard and
  // screen-reader users land on the new content instead of a stale button.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasInteracted = useRef(false);
  useEffect(() => {
    if (hasInteracted.current) headingRef.current?.focus();
  }, [session]);

  const handleAnswer = (answer: Answer) => {
    hasInteracted.current = true;
    setSession((current) => answerStep(current, workflow, answer));
  };

  const handleBack = () => {
    hasInteracted.current = true;
    setSession((current) => goBack(current));
  };

  const handleStartOver = () => {
    hasInteracted.current = true;
    setSession(startSession(workflow));
  };

  const canGoBack = session.answers.length > 0;

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-600">{workflow.title}</h1>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        {session.outcome === "RESOLVED" && <ResolvedView headingRef={headingRef} />}

        {session.outcome === "ESCALATE" && (
          <EscalationView
            workflow={workflow}
            answers={session.answers}
            headingRef={headingRef}
          />
        )}

        {session.currentStepId !== null && (
          <StepView
            step={getStep(workflow, session.currentStepId)}
            stepNumber={session.answers.length + 1}
            onAnswer={handleAnswer}
            headingRef={headingRef}
          />
        )}
      </div>

      {canGoBack && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-12 rounded-xl px-4 text-base font-semibold text-blue-800 underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-blue-400"
          >
            &larr; Back
          </button>
          <button
            type="button"
            onClick={handleStartOver}
            className="min-h-12 rounded-xl px-4 text-base font-semibold text-slate-700 underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-blue-400"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
