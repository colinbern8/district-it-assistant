import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LoadingPlaceholder from "@/components/LoadingPlaceholder";
import TroubleshootingUnavailable from "@/components/TroubleshootingUnavailable";
import TroubleshootingWizard from "@/components/TroubleshootingWizard";
import { ApiUnavailableError, getWorkflow } from "@/lib/workflows";

type Props = PageProps<"/troubleshoot/[workflowId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workflowId } = await params;
  try {
    const workflow = await getWorkflow(workflowId);
    return { title: workflow ? `${workflow.title} | District IT Help` : "Not found" };
  } catch {
    return { title: "District IT Help" };
  }
}

/**
 * The page itself reads nothing from the URL. That lets Next.js prerender it
 * (header + loading placeholder) once, for every workflow, and show it
 * instantly when a student clicks a link. The part that needs the URL
 * (`params`) and the API lives inside <Suspense> and streams in right after.
 */
export default function TroubleshootPage({ params }: Props) {
  return (
    <Suspense fallback={<LoadingPlaceholder label="Loading troubleshooting steps" blocks={2} />}>
      <WorkflowContent params={params} />
    </Suspense>
  );
}

async function WorkflowContent({ params }: Pick<Props, "params">) {
  const { workflowId } = await params;

  let workflow;
  try {
    workflow = await getWorkflow(workflowId);
  } catch (error) {
    if (error instanceof ApiUnavailableError) return <TroubleshootingUnavailable />;
    throw error;
  }

  // Called outside the try/catch: notFound() works by throwing a special error.
  if (!workflow) notFound();

  return <TroubleshootingWizard workflow={workflow} />;
}
