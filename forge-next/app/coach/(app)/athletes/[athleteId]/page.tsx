import { notFound } from "next/navigation";
import { CoachAthleteDetailView } from "@/components/coach-athlete-detail-view";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import {
  getActiveAthletePlan,
  listAthleteAssignedPlans,
} from "@/lib/athlete/plan/repository";
import { getCoachAthleteRelationship } from "@/lib/links/repository";

export default async function CoachAthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const coach = await requireRole("coach");
  const { athleteId } = await params;
  const relationship = await getCoachAthleteRelationship(athleteId);

  if (!relationship || relationship.status !== "active") {
    notFound();
  }

  const [activePlanResult, previousPlansResult] = await Promise.all([
    relationship.currentPlanName
      ? getActiveAthletePlan(relationship.athleteId)
      : Promise.resolve({ ok: true as const, plan: null }),
    listAthleteAssignedPlans(relationship.athleteId, coach.id),
  ]);

  if (!activePlanResult.ok) {
    throw new Error(activePlanResult.message);
  }

  if (!previousPlansResult.ok) {
    throw new Error(previousPlansResult.message);
  }

  const activePlan = activePlanResult.plan;
  const previousPlans = previousPlansResult.plans;

  return (
    <PageShell back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}>
      <CoachAthleteDetailView
        relationship={relationship}
        activePlan={activePlan}
        previousPlans={previousPlans}
      />
    </PageShell>
  );
}
