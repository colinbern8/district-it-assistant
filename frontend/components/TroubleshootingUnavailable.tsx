import Link from "next/link";

/**
 * Shown when the backend can't be reached. Students always get a way forward:
 * the school office, and the damage page (which never needs the backend).
 */
export default function TroubleshootingUnavailable() {
  return (
    <div role="alert" className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2 className="text-2xl font-bold text-blue-950">
        Troubleshooting is not available right now
      </h2>
      <p className="mt-3 text-lg text-blue-950">
        Please go to your school office with your Chromebook and charger. They
        will connect you with a technician on Zoom.
      </p>
      <p className="mt-4 text-blue-950">
        Is your Chromebook damaged, or is the battery bulging, very hot, or
        smoking?{" "}
        <Link href="/damaged" className="font-semibold text-blue-800 underline">
          Read what to do now
        </Link>
        .
      </p>
    </div>
  );
}
