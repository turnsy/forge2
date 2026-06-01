import { notFound } from "next/navigation";
import { PencilIcon } from "@/components/icons/pencil-icon";
import { PlanViewer } from "@/components/plan/plan-viewer";
import { Button, ErrorState, PageContent, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format/date";
import { getCoachPlanById } from "@/lib/plans/repository";

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
        <PageHeader title="Plan" />
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

  return (
    <PageContent>
      <PageHeader
        title={plan.name}
        description={plan.description}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            icon={<PencilIcon />}
          >
            Edit
          </Button>
        }
      />
      <p className="text-sm text-surface-muted">Created {formatDate(detail.createdAt)}</p>
      <PlanViewer plan={plan} view="coach" />
    </PageContent>
  );
}
