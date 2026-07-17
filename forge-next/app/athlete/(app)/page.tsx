import { AthleteLinkForm } from "@/components/athlete-link-form";
import { AthleteLinkPendingView } from "@/components/athlete-link-pending-view";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import { NoPlanAssignedView } from "@/components/no-plan-assigned-view";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { findCurrentDay } from "@/lib/athlete/plan/domain";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";
import { listAthleteMaxes } from "@/lib/maxes/mutations";

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
  const exerciseIds = assignment.plan.weeks.flatMap((week) =>
    week.days.flatMap((day) =>
      day.blocks.flatMap((block) =>
        block.exercises
          .map((exercise) => exercise.resolvedBasisExerciseId ?? exercise.resolvedExerciseId)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  );
  const maxRows = await listAthleteMaxes(user.id, [...new Set(exerciseIds)]);
  const maxesByExerciseId = Object.fromEntries(
    maxRows.map((row) => [row.exercise_id, { value: Number(row.value), unit: row.unit }]),
  );

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
        assignmentId={assignment.id}
        plan={assignment.plan}
        coachName={link.coachName}
        maxesByExerciseId={maxesByExerciseId}
      />
    </PageShell>
  );
}
