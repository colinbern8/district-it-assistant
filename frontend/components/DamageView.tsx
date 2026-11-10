import Link from "next/link";
import type { Ref } from "react";

/**
 * Shown for outcome ESCALATE_DAMAGE, for the "My Chromebook is damaged"
 * button, and on the /damaged page.
 *
 * Policy: troubleshooting stops here. The assistant does not create repair
 * tickets, offer loaners, or suggest repairs. A technician handles the damage
 * report through the district's existing process.
 */
export default function DamageView({
  headingRef,
}: {
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-blue-950 focus:outline-none"
      >
        Stop: your Chromebook needs a technician
      </h2>
      <p className="mt-3 text-lg text-blue-950">
        Damage needs to be checked by a technician. Please don&apos;t try to fix
        it yourself.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg text-blue-950">
        <li>Stop troubleshooting.</li>
        <li>Take your Chromebook and its charger to your school office.</li>
        <li>Tell the office staff your Chromebook is damaged.</li>
        <li>A technician will look at it and take care of the damage report.</li>
      </ol>

      <div
        role="note"
        className="mt-5 rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-red-900"
      >
        <span className="font-semibold">Is the battery bulging, very hot, smoking, or
        does it smell like burning? </span>
        Stop using it and don&apos;t charge it. Tell a teacher or school staff
        right away.
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-xl border-2 border-blue-700 bg-white px-6 text-lg font-semibold text-blue-800 hover:bg-blue-100 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      >
        Back to all help topics
      </Link>
    </div>
  );
}
