import Link from "next/link";
import type { Ref } from "react";
import { getStep, type AnsweredStep } from "@/lib/workflowEngine";
import type { Workflow } from "@/lib/types";

interface EscalationViewProps {
  workflow: Workflow;
  answers: AnsweredStep[];
  headingRef: Ref<HTMLHeadingElement>;
}

/**
 * Shown when the user's answers lead to "ESCALATE".
 * Sends them to the existing school office / Zoom technician process and
 * lists what they already tried, so the technician doesn't repeat it.
 */
export default function EscalationView({
  workflow,
  answers,
  headingRef,
}: EscalationViewProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-blue-950 focus:outline-none"
      >
        A technician needs to help with this
      </h2>
      <p className="mt-3 text-lg text-blue-950">
        That&apos;s okay! Some problems need a technician. Here&apos;s what to do:
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg text-blue-950">
        <li>Go to your school office.</li>
        <li>Bring your Chromebook and its charger.</li>
        <li>
          Tell the office staff: &ldquo;{workflow.title}.&rdquo; They will
          connect you with a technician on Zoom.
        </li>
        <li>
          The technician may ask for your Chromebook&apos;s 6-digit asset tag.
          It&apos;s on the sticker on the bottom of the Chromebook.
        </li>
      </ol>

      {answers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-blue-950">
            Show the technician what you already checked:
          </h3>
          <ul className="mt-2 space-y-1 text-blue-950">
            {answers.map(({ stepId, answer }) => {
              const step = getStep(workflow, stepId);
              return (
                <li key={stepId}>
                  {step.title}: {step.question}{" "}
                  <span className="font-semibold">
                    {answer === "yes" ? "Yes" : "No"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-xl border-2 border-blue-700 bg-white px-6 text-lg font-semibold text-blue-800 hover:bg-blue-100 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      >
        Back to all help topics
      </Link>
    </div>
  );
}
