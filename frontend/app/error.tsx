"use client";

/**
 * Last-resort error page for unexpected bugs. (Backend outages are handled
 * inside the pages themselves, so the rest of the page keeps working.)
 * Error pages must be Client Components so they can offer "Try again".
 */
import TroubleshootingUnavailable from "@/components/TroubleshootingUnavailable";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <TroubleshootingUnavailable />
      <button
        type="button"
        onClick={reset}
        className="min-h-12 rounded-xl px-4 text-base font-semibold text-blue-800 underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-blue-400"
      >
        Try again
      </button>
    </div>
  );
}
