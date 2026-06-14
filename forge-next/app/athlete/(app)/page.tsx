import { AthleteLinkForm } from "@/components/athlete-link-form";
import { AthleteLinkPendingView } from "@/components/athlete-link-pending-view";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import { NoPlanAssignedView } from "@/components/no-plan-assigned-view";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { findCurrentDay } from "@/lib/athlete/plan/domain";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";

const centeredMainClass =
  "mx-auto flex min-h-full max-w-3xl flex-1 items-center justify-center p-4 md:p-8";

const stackedMainClass =
  "mx-auto flex min-h-full max-w-3xl flex-col gap-6 p-4 md:p-8";

export default async function AthletePage() {
  const user = await requireRole("athlete");
  const link = await getAthleteCoachLink();

  if (!link) {
    return (
      <main className={centeredMainClass}>
        <AthleteLinkForm />
      </main>
    );
  }

  if (link.status === "pending") {
    return (
      <main className={stackedMainClass}>
        <AthleteLinkPendingView link={link} />
      </main>
    );
  }

  const assignmentResult = await getActiveAthletePlan(user.id);

  if (!assignmentResult.ok) {
    throw new Error(assignmentResult.message);
  }

  const assignment = assignmentResult.plan;

  if (!assignment) {
    return (
      <main className={stackedMainClass}>
        <NoPlanAssignedView />
      </main>
    );
  }

  const currentDay = findCurrentDay(assignment.plan);

  if (!currentDay) {
    return (
      <main className={stackedMainClass}>
        <NoPlanAssignedView />
      </main>
    );
  }

  return (
    <PageShell>
      <AthletePlanEntryView
        key={`${currentDay.weekIndex}-${currentDay.dayIndex}`}
        assignmentId={assignment.id}
        plan={assignment.plan}
        currentDay={currentDay}
        coachName={link.coachName}
      />
    </PageShell>
  );
}
