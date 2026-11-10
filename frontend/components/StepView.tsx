import type { Ref } from "react";
import type { Answer, WarningLevel, WorkflowStep } from "@/lib/types";

interface StepViewProps {
  step: WorkflowStep;
  stepNumber: number;
  onAnswer: (answer: Answer) => void;
  /** Lets the parent move keyboard/screen-reader focus to this heading. */
  headingRef: Ref<HTMLHeadingElement>;
}

/** Shows one step: its instructions, an optional warning, and Yes/No buttons. */
export default function StepView({
  step,
  stepNumber,
  onAnswer,
  headingRef,
}: StepViewProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Step {stepNumber}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 text-2xl font-bold text-slate-900 focus:outline-none"
      >
        {step.title}
      </h2>

      {/* Warnings go ABOVE the instructions so they're read before acting. */}
      {step.warning && <StepWarning level={step.warning_level} text={step.warning} />}

      <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg text-slate-800">
        {step.instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ol>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-slate-900">
          {step.question}
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <AnswerButton label="Yes" onClick={() => onAnswer("yes")} />
          <AnswerButton label="No" onClick={() => onAnswer("no")} />
        </div>
      </fieldset>
    </div>
  );
}

/**
 * Yellow "caution" box, or a red "data_loss" box for steps that erase data
 * (Powerwash), so the two can't be confused with each other.
 */
function StepWarning({ level = "caution", text }: { level?: WarningLevel; text: string }) {
  const isDataLoss = level === "data_loss";
  return (
    <div
      role="note"
      className={
        isDataLoss
          ? "mt-4 rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-red-900"
          : "mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-900"
      }
    >
      <span className="font-semibold">
        {isDataLoss ? "Warning, this erases data: " : "Before you start: "}
      </span>
      {text}
    </div>
  );
}

function AnswerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-14 rounded-xl bg-blue-700 px-6 text-xl font-semibold text-white hover:bg-blue-800 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:bg-blue-900"
    >
      {label}
    </button>
  );
}
