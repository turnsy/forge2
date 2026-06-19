import { notFound } from "next/navigation";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import { ErrorState, PageContent, PageHeader, PageShell } from "@/components/ui";
import { firstName } from "@/lib/auth/first-name";
import { requireRole } from "@/lib/auth/session";
import { getCoachPlanById } from "@/lib/plans/repository";
import { isPromptBetaEnabled } from "@/lib/prompts/prompt-beta-access";

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

export default async function CoachHomePage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const user = await requireRole("coach");
  const { planId } = await searchParams;
  const promptEnabled = isPromptBetaEnabled(user.email);

  if (planId) {
    const result = await getCoachPlanById(user.id, planId);

    if (result.status === "not_found") {
      notFound();
    }

    if (result.status === "invalid") {
      const isDev = process.env.NODE_ENV === "development";

      return (
        <PageShell back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
          <PageHeader title="Plan" />
          <ErrorState
            title="Plan validation failed"
            description={
              isDev
                ? "This plan's data does not match the workout plan schema."
                : "This plan couldn't be loaded."
            }
            details={
              isDev ? <PlanValidationErrors errors={result.errors} /> : undefined
            }
          />
        </PageShell>
      );
    }

    const { detail } = result;

    return (
      <PageContent className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden max-w-none !p-0">
        <CoachWorkspace
          firstName={firstName(user.fullName)}
          role="coach"
          planId={detail.id}
          initialPlan={detail.plan}
          stripPlanIdOnClear
          promptEnabled={promptEnabled}
        />
      </PageContent>
    );
  }

  return (
    <PageContent className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden max-w-none !p-0">
      <CoachWorkspace
        firstName={firstName(user.fullName)}
        role="coach"
        promptEnabled={promptEnabled}
      />
    </PageContent>
  );
}
