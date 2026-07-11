import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import { TurnActivityIndicator } from "@/components/chat/turn-activity-indicator";
import { MOBILE_BOTTOM_NAV_SCROLL_END_CLASS } from "@/lib/coach/mobile-workspace-layout";
import { isTurnInProgress, getTurnActivityLabel } from "@/lib/chat/turn-activity";
import type { ChatStatus, ChatWorkspacePhase } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function WorkoutPlanArtifactPreview({
  plan,
  runStatus,
  phase = "idle",
  disabled,
  onPlanChange,
}: {
  plan: WorkoutPlan;
  runStatus: ChatStatus | null;
  phase?: ChatWorkspacePhase;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
}) {
  const showOverlaySpinner = isTurnInProgress(phase, runStatus);
  const activityLabel = showOverlaySpinner
    ? getTurnActivityLabel(phase, runStatus)
    : null;

  const scrollClass = showOverlaySpinner ? "overflow-hidden" : "overflow-y-auto";

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col ${scrollClass} ${MOBILE_BOTTOM_NAV_SCROLL_END_CLASS}`}
    >
      {activityLabel ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <TurnActivityIndicator
            align="center"
            className="h-5 w-5 border"
            label={activityLabel}
          />
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
