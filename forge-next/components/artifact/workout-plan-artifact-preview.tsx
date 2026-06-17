import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import { Spinner } from "@/components/ui";
import { shouldShowPreviewSpinner } from "@/lib/chat/run-status-copy";
import type { ChatStatus } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function WorkoutPlanArtifactPreview({
  plan,
  runStatus,
}: {
  plan: WorkoutPlan;
  runStatus: ChatStatus | null;
}) {
  const showOverlaySpinner = shouldShowPreviewSpinner(runStatus);

  return (
    <div className="relative h-full min-h-0 overflow-y-auto">
      {showOverlaySpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Spinner label="Working…" />
        </div>
      ) : null}
      <PlanDayNavigator plan={plan} view="coach" readOnly />
    </div>
  );
}
