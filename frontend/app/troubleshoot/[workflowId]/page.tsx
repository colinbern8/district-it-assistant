import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TroubleshootingWizard from "@/components/TroubleshootingWizard";
import { getAllWorkflows, getWorkflow } from "@/lib/workflows";

/**
 * Tells Next.js every valid workflow id, so each page is built ahead of time.
 * Any other id falls through to notFound() below.
 */
export function generateStaticParams() {
  return getAllWorkflows().map((workflow) => ({ workflowId: workflow.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/troubleshoot/[workflowId]">): Promise<Metadata> {
  const { workflowId } = await params;
  const workflow = getWorkflow(workflowId);
  return { title: workflow ? `${workflow.title} | District IT Help` : "Not found" };
}

/** Server component: looks up the workflow, then hands it to the client wizard. */
export default async function TroubleshootPage({
  params,
}: PageProps<"/troubleshoot/[workflowId]">) {
  const { workflowId } = await params;
  const workflow = getWorkflow(workflowId);

  if (!workflow) {
    notFound();
  }

  return <TroubleshootingWizard workflow={workflow} />;
}
