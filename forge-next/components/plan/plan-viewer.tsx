import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import { PlanViewerMeta } from "@/components/plan/plan-viewer-meta";
import type { PlanViewerView } from "@/components/plan/plan-set-table";

export function PlanViewer({
  plan,
  view,
  showMeta = true,
}: {
  plan: WorkoutPlan;
  view: PlanViewerView;
  showMeta?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showMeta ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:w-[26rem]">
          <PlanViewerMeta plan={plan} />
        </dl>
      ) : null}
      {plan.notes ? (
        <p className="text-sm text-surface-muted">{plan.notes}</p>
      ) : null}
      <PlanDayNavigator plan={plan} view={view} readOnly />
    </div>
  );
}
