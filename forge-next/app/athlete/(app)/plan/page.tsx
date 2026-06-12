import { redirect } from "next/navigation";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { findCurrentDay } from "@/lib/athlete/plan/domain";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";

export default async function AthletePlanPage() {
  const user = await requireRole("athlete");
  const link = await getAthleteCoachLink();

  if (!link || link.status !== "active") {
    redirect("/athlete");
  }

  const assignment = await getActiveAthletePlan(user.id);
  const coachName = link.coachName;

  if (!assignment) {
    redirect("/athlete");
  }

  const currentDay = findCurrentDay(assignment.plan);

  if (!currentDay) {
    redirect("/athlete");
  }

  return (
    <PageShell>
      <AthletePlanEntryView
        key={`${assignment.id}-${currentDay.weekIndex}-${currentDay.dayIndex}`}
        assignmentId={assignment.id}
        plan={assignment.plan}
        currentDay={currentDay}
        coachName={coachName}
      />
    </PageShell>
  );
}
