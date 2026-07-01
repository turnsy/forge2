import { notFound } from "next/navigation";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import { ErrorState, PageContent, PageHeader, PageShell } from "@/components/ui";
import { firstName } from "@/lib/auth/first-name";
import { requireRole } from "@/lib/auth/session";
import { loadChatSession } from "@/lib/chat/session-storage";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";
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
  searchParams: Promise<{ planId?: string; sessionId?: string; new?: string }>;
}) {
  const user = await requireRole("coach");
  const { planId, sessionId, new: newPlan } = await searchParams;
  const promptEnabled = isPromptBetaEnabled(user.email);

  if (sessionId) {
    const result = await loadChatSession(user.id, sessionId);

    if (result.status === "found") {
      return (
        <PageContent className="flex h-full min-h-0 flex-1 flex-col overflow-hidden max-w-none !gap-0 !p-0">
          <CoachWorkspace
            key={`session-${result.session.id}`}
            firstName={firstName(user.fullName)}
            role="coach"
            initialSession={result.session}
            promptEnabled={promptEnabled}
          />
        </PageContent>
      );
    }

    if (result.status === "error") {
      return (
        <PageShell back={{ href: "/coach", ariaLabel: "Back to coach home" }}>
          <PageHeader title="Conversation" />
          <ErrorState
            title="Couldn't load conversation"
            description="Something went wrong while loading this conversation."
          />
        </PageShell>
      );
    }

    return (
      <PageShell back={{ href: "/coach", ariaLabel: "Back to coach home" }}>
        <PageHeader title="Conversation" />
        <ErrorState
          title="Conversation not found"
          description="This conversation may have been deleted or is no longer available."
        />
      </PageShell>
    );
  }

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
      <PageContent className="flex h-full min-h-0 flex-1 flex-col overflow-hidden max-w-none !gap-0 !p-0">
        <CoachWorkspace
          key={`plan-${detail.id}`}
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

  if (newPlan !== undefined) {
    return (
      <PageContent className="flex h-full min-h-0 flex-1 flex-col overflow-hidden max-w-none !gap-0 !p-0">
        <CoachWorkspace
          key="coach-new-plan"
          firstName={firstName(user.fullName)}
          role="coach"
          initialPlan={createEmptyWorkoutPlan()}
          promptEnabled={promptEnabled}
        />
      </PageContent>
    );
  }

  return (
    <PageContent className="flex h-full min-h-0 flex-1 flex-col overflow-hidden max-w-none !gap-0 !p-0">
      <CoachWorkspace
        key="coach-home"
        firstName={firstName(user.fullName)}
        role="coach"
        promptEnabled={promptEnabled}
      />
    </PageContent>
  );
}
