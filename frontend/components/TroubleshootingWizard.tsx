"use client";

/**
 * The interactive part of the app. It holds the session state and decides
 * which view to show. The actual "what comes next" logic lives in
 * lib/workflowEngine.ts; this component just calls it and re-renders.
 */
import { useEffect, useRef, useState, type SetStateAction } from "react";
import DamageView from "@/components/DamageView";
import EscalationView from "@/components/EscalationView";
import ResolvedView from "@/components/ResolvedView";
import SafetyView from "@/components/SafetyView";
import StepView from "@/components/StepView";
import { STOP_OUTCOMES, type Answer, type Workflow } from "@/lib/types";
import {
  answerStep,
  getStep,
  goBack,
  reportDamage,
  startSession,
  type SessionState,
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

  // Every handler marks the interaction, then swaps in the engine's new state.
  const update = (next: SetStateAction<SessionState>) => {
    hasInteracted.current = true;
    setSession(next);
  };
  const handleAnswer = (answer: Answer) =>
    update((current) => answerStep(current, workflow, answer));
  const handleBack = () => update((current) => goBack(current));
  const handleStartOver = () => update(startSession(workflow));
  const handleDamage = () => update((current) => reportDamage(current));

  // Damage and safety outcomes stop troubleshooting: no Back or Start over.
  const isStopped = session.outcome !== null && STOP_OUTCOMES.includes(session.outcome);
  const canGoBack = session.answers.length > 0 && !isStopped;

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-600">{workflow.title}</h1>

      {workflow.review_status !== "approved" && (
        <p
          role="note"
          className="mt-2 rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-800"
        >
          <span className="font-semibold">Draft:</span> these steps have not been
          reviewed by a district technician yet.
        </p>
      )}

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        {session.outcome === "RESOLVED" && <ResolvedView headingRef={headingRef} />}

        {session.outcome === "ESCALATE" && (
          <EscalationView
            workflow={workflow}
            answers={session.answers}
            headingRef={headingRef}
          />
        )}

        {session.outcome === "ESCALATE_DAMAGE" && <DamageView headingRef={headingRef} />}

        {session.outcome === "ESCALATE_SAFETY" && <SafetyView headingRef={headingRef} />}

        {session.currentStepId !== null && (
          <StepView
            step={getStep(workflow, session.currentStepId)}
            stepNumber={session.answers.length + 1}
            onAnswer={handleAnswer}
            headingRef={headingRef}
          />
        )}
      </div>

      {session.currentStepId !== null && (
        <button
          type="button"
          onClick={handleDamage}
          className="mt-4 min-h-12 w-full rounded-xl border-2 border-red-700 bg-white px-4 text-base font-semibold text-red-800 hover:bg-red-50 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-400 sm:w-auto"
        >
          My Chromebook is damaged
        </button>
      )}

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
