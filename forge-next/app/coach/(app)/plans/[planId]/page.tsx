import { notFound } from "next/navigation";
import { CoachPlanDetailView } from "@/components/plan/coach-plan-detail-view";
import { ErrorState, PageContent, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { getCoachPlanById, listCoachPlanVersions } from "@/lib/plans/repository";

function PlanValidationErrors({
  errors,
}: {
  errors: { path: string; message: string }[];
}) {
  return (
    <ul className="space-y-2 font-mono text-xs">
      {errors.map((error, index) => (
        <li key={`${error.path}-${index}`}>
          <span className="text-surface-foreground">{error.path}</span>
          <span className="text-surface-muted">: {error.message}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function CoachPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const user = await requireRole("coach");
  const result = await getCoachPlanById(user.id, planId);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "invalid") {
    const isDev = process.env.NODE_ENV === "development";

    return (
      <PageContent>
        <PageHeader
          title="Plan"
          back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}
        />
        <ErrorState
          title="Plan validation failed"
          description={
            isDev
              ? "This plan's data does not match the workout plan schema."
              : "This plan couldn't be loaded."
          }
          details={isDev ? <PlanValidationErrors errors={result.errors} /> : undefined}
        />
      </PageContent>
    );
  }

  const { detail } = result;
  const { plan } = detail;
  const versions = await listCoachPlanVersions(user.id, planId);

  return (
    <PageContent>
      <CoachPlanDetailView
        planId={planId}
        plan={plan}
        createdAt={detail.createdAt}
        versions={versions}
      />
    </PageContent>
  );
}
