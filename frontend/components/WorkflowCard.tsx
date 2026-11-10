import Link from "next/link";
import type { Workflow } from "@/lib/types";

/** A clickable card on the home page that starts one workflow. */
export default function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <Link
      href={`/troubleshoot/${workflow.id}`}
      className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-2 hover:ring-blue-600 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
    >
      <h2 className="text-xl font-bold text-slate-900">{workflow.title}</h2>
      <p className="mt-1 text-slate-700">{workflow.summary}</p>
      <p className="mt-3 text-sm font-medium text-blue-700">
        About {workflow.estimated_minutes} minutes &rarr;
      </p>
    </Link>
  );
}
