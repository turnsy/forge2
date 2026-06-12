import { AthletePlanCompleteView } from "@/components/athlete-plan-complete-view";
import { AthletePlanEntryView } from "@/components/athlete-plan-entry-view";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { findCurrentDay, areAllDaysComplete } from "@/lib/athlete/plan/domain";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";
import Link from "next/link";

export default async function AthletePlanPage() {
  const user = await requireRole("athlete");
  const assignment = await getActiveAthletePlan(user.id);
  const link = await getAthleteCoachLink();
  const coachName = link?.coachName ?? "your coach";

  if (!assignment) {
    return (
      <PageShell back={{ href: "/athlete", ariaLabel: "Back to home" }}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No active plan assigned yet.
          </p>
          <Link
            href="/athlete"
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Back to Home
          </Link>
        </div>
      </PageShell>
    );
  }

  if (areAllDaysComplete(assignment.plan)) {
    return (
      <PageShell back={{ href: "/athlete", ariaLabel: "Back to home" }}>
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
      <PageShell back={{ href: "/athlete", ariaLabel: "Back to home" }}>
        <AthletePlanCompleteView
          planName={assignment.plan.name}
          coachName={coachName}
        />
      </PageShell>
    );
  }

  return (
    <PageShell back={{ href: "/athlete", ariaLabel: "Back to home" }}>
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
