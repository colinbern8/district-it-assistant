import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        We couldn&apos;t find that help topic
      </h1>
      <p className="mt-2 text-lg text-slate-700">
        The link may be old or mistyped.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-700 px-6 text-lg font-semibold text-white hover:bg-blue-800"
      >
        See all help topics
      </Link>
    </div>
  );
}
