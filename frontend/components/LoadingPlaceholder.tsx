/**
 * Gray boxes shown for a moment while workflows load from the API. They are
 * part of the prerendered page, so they appear instantly on every visit.
 */
export default function LoadingPlaceholder({
  label,
  blocks = 3,
}: {
  label: string;
  blocks?: number;
}) {
  return (
    <div role="status" aria-busy="true" className="mt-6 space-y-4">
      <span className="sr-only">{label}</span>
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
