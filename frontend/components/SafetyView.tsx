import Link from "next/link";
import type { Ref } from "react";

/**
 * Shown for outcome ESCALATE_SAFETY: swollen battery, overheating, smoke, or
 * a burning smell. The student stops using the device and tells staff now.
 */
export default function SafetyView({
  headingRef,
}: {
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="rounded-xl border-2 border-red-600 bg-red-50 p-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-red-900 focus:outline-none"
      >
        Stop using your Chromebook now
      </h2>
      <p className="mt-3 text-lg text-red-900">
        A bulging, very hot, or smoking battery can be dangerous.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg text-red-900">
        <li>Stop using it, and don&apos;t charge it.</li>
        <li>
          If there is smoke, or it is too hot to touch, don&apos;t touch it.
          Move away from it.
        </li>
        <li>
          Tell a teacher or school staff right away. If you are at home, tell an
          adult right away.
        </li>
        <li>School staff will tell you what to do next.</li>
      </ol>

      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-xl border-2 border-red-700 bg-white px-6 text-lg font-semibold text-red-800 hover:bg-red-100 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-400"
      >
        Back to all help topics
      </Link>
    </div>
  );
}
