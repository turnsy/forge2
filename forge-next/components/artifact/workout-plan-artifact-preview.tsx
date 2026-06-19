import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import { Spinner } from "@/components/ui";
import { MOBILE_BOTTOM_NAV_SCROLL_END_CLASS } from "@/lib/coach/mobile-workspace-layout";
import { shouldShowPreviewSpinner } from "@/lib/chat/run-status-copy";
import type { ChatStatus } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function WorkoutPlanArtifactPreview({
  plan,
  runStatus,
  disabled,
  onPlanChange,
}: {
  plan: WorkoutPlan;
  runStatus: ChatStatus | null;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
}) {
  const showOverlaySpinner = shouldShowPreviewSpinner(runStatus);

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-y-auto ${MOBILE_BOTTOM_NAV_SCROLL_END_CLASS}`}
    >
      {showOverlaySpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Spinner label="Working…" />
        </div>
      ) : null}
      <PlanDayNavigator
        plan={plan}
        view="coach"
        readOnly={false}
        onPlanChange={onPlanChange}
        disabled={disabled}
      />
    </div>
  );
}
