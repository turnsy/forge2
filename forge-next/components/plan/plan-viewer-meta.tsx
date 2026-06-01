import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { MetaGroup, MetaItem } from "@/components/ui";
import { getPlanStats } from "@/lib/plans/stats";

export function PlanViewerMeta({ plan }: { plan: WorkoutPlan }) {
  const { weekCount, daysPerWeek } = getPlanStats(plan);

  return (
    <MetaGroup>
      <MetaItem label="Weeks" value={weekCount} />
      <MetaItem label="Days/week" value={daysPerWeek} />
      {plan.discipline ? <MetaItem label="Discipline" value={plan.discipline} /> : null}
    </MetaGroup>
  );
}
