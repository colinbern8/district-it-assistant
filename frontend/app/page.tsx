import WorkflowCard from "@/components/WorkflowCard";
import { getAllWorkflows } from "@/lib/workflows";

/** Home page: pick the problem you are having. */
export default function HomePage() {
  const workflows = getAllWorkflows();

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        What do you need help with?
      </h1>
      <p className="mt-2 text-lg text-slate-700">
        Pick your problem. We&apos;ll walk you through it one step at a time.
      </p>

      <ul className="mt-6 space-y-4">
        {workflows.map((workflow) => (
          <li key={workflow.id}>
            <WorkflowCard workflow={workflow} />
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Don&apos;t see your problem?
        </h2>
        <p className="mt-1 text-slate-700">
          Go to your school office with your Chromebook and charger. They will
          connect you with a technician on Zoom.
        </p>
      </section>
    </div>
  );
}
