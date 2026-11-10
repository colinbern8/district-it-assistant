import Link from "next/link";
import { Suspense } from "react";
import LoadingPlaceholder from "@/components/LoadingPlaceholder";
import TroubleshootingUnavailable from "@/components/TroubleshootingUnavailable";
import WorkflowCard from "@/components/WorkflowCard";
import { ApiUnavailableError, getWorkflowsByCategory } from "@/lib/workflows";

/**
 * Home page. Everything except the topic list is static, so the heading and
 * the damage card appear instantly, even when the backend is down.
 */
export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        What&apos;s wrong with your Chromebook?
      </h1>
      <p className="mt-2 text-lg text-slate-700">
        Pick your problem. We&apos;ll walk you through it one step at a time.
      </p>

      {/* Damage comes first: students should never troubleshoot a damaged device. */}
      <Link
        href="/damaged"
        className="mt-6 block rounded-2xl border-2 border-red-700 bg-white p-5 hover:bg-red-50 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-400"
      >
        <h2 className="text-lg font-bold text-red-800">
          Damaged, lost, or stolen Chromebook?
        </h2>
        <p className="mt-1 text-slate-700">
          Don&apos;t try to fix it. Go to your school office. &rarr;
        </p>
      </Link>

      <Suspense fallback={<LoadingPlaceholder label="Loading help topics" blocks={4} />}>
        <HelpTopics />
      </Suspense>

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

/** Fetches the topic list from the API at request time. */
async function HelpTopics() {
  let categories;
  try {
    categories = await getWorkflowsByCategory();
  } catch (error) {
    if (error instanceof ApiUnavailableError) {
      return (
        <div className="mt-8">
          <TroubleshootingUnavailable />
        </div>
      );
    }
    throw error; // A real bug: let the error page handle it.
  }

  // Possible in production before any workflow has been approved.
  if (categories.length === 0) {
    return (
      <div className="mt-8">
        <TroubleshootingUnavailable />
      </div>
    );
  }

  return categories.map((category) => (
    <section key={category.id} className="mt-8" aria-labelledby={category.id}>
      <h2 id={category.id} className="text-xl font-bold text-slate-800">
        {category.label}
      </h2>
      <ul className="mt-3 space-y-4">
        {category.workflows.map((workflow) => (
          <li key={workflow.id}>
            <WorkflowCard workflow={workflow} />
          </li>
        ))}
      </ul>
    </section>
  ));
}
