import type { Metadata } from "next";
import DamageView from "@/components/DamageView";

export const metadata: Metadata = {
  title: "Damaged, lost, or stolen Chromebook | District IT Help",
};

/** Linked from the home page. Lost or stolen devices also go to the office. */
export default function DamagedPage() {
  return (
    <div className="space-y-6">
      <DamageView />
      <section className="rounded-2xl border border-slate-300 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Lost or stolen Chromebook?
        </h2>
        <p className="mt-1 text-slate-700">
          Go to your school office and tell the staff as soon as you can.
        </p>
      </section>
    </div>
  );
}
