import { redirect } from "next/navigation";
import { AthletePlanCompleteView } from "@/components/athlete-plan-complete-view";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { findCurrentDay, areAllDaysComplete } from "@/lib/athlete/plan/domain";
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

  if (areAllDaysComplete(assignment.plan)) {
    return (
      <PageShell>
        <AthletePlanCompleteView
          planName={assignment.plan.name}
          coachName={coachName}
        />
      </PageShell>
    );
  }

  const currentDay = findCurrentDay(assignment.plan);

  if (!currentDay) {
    return (
      <PageShell>
        <AthletePlanCompleteView
          planName={assignment.plan.name}
          coachName={coachName}
        />
      </PageShell>
    );
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
