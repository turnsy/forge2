import { PlanViewer } from "@/components/plan/plan-viewer";
import { Spinner } from "@/components/ui";
import { getRunStatusLabel, shouldShowPreviewSpinner } from "@/lib/plan-chat/run-status-copy";
import type { PlanChatRunStatus } from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function PreviewLoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6 text-center">
      <Spinner className="h-8 w-8" label={label} />
      <p className="text-sm text-surface-muted">{label}</p>
    </div>
  );
}

export function PlanChatPreview({
  plan,
  runStatus,
  isAwaitingPlan,
}: {
  plan: WorkoutPlan | null;
  runStatus: PlanChatRunStatus | null;
  isAwaitingPlan: boolean;
}) {
  const showOverlaySpinner = plan !== null && shouldShowPreviewSpinner(runStatus);

  if (!plan) {
    if (isAwaitingPlan) {
      <Spinner />
    }

    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-surface-muted">
          Your workout plan will show here once it is ready.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-y-auto">
      {showOverlaySpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Spinner label="Updating plan" />
        </div>
      ) : null}
      <PlanViewer plan={plan} view="coach" />
    </div>
  );
}
