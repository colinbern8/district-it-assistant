import Link from "next/link";
import type { Ref } from "react";

/** Shown when the user's answers lead to "RESOLVED". */
export default function ResolvedView({
  headingRef,
}: {
  headingRef: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-green-900 focus:outline-none"
      >
        Great, your Chromebook is working!
      </h2>
      <p className="mt-3 text-lg text-green-900">
        You fixed it yourself. If the problem comes back, run these steps again
        or visit your school office for help.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-green-700 px-6 text-lg font-semibold text-white hover:bg-green-800 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-green-400"
      >
        Back to all help topics
      </Link>
    </div>
  );
}
