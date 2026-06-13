import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { MetaGroup, MetaItem } from "@/components/ui";
import { getPlanStats } from "@/lib/plans/stats";

export function PlanViewerMeta({
  plan,
  layout = "grid",
  showDiscipline = true,
}: {
  plan: WorkoutPlan;
  layout?: "grid" | "row";
  showDiscipline?: boolean;
}) {
  const { weekCount, daysPerWeek } = getPlanStats(plan);

  const items = (
    <MetaGroup>
      <MetaItem label="Weeks" value={weekCount} />
      <MetaItem label="Days/week" value={daysPerWeek} />
      {showDiscipline && plan.discipline ? (
        <MetaItem label="Discipline" value={plan.discipline} />
      ) : null}
    </MetaGroup>
  );

  if (layout === "row") {
    return (
      <dl className="flex flex-wrap items-start gap-x-6 gap-y-2">{items}</dl>
    );
  }

  return items;
}
