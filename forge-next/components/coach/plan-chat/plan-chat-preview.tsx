import { PlanViewer } from "@/components/plan/plan-viewer";
import { EmptyState, Spinner } from "@/components/ui";
import { shouldShowPreviewSpinner } from "@/lib/plan-chat/run-status-copy";
import type { PlanChatRunStatus } from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function PlanChatPreview({
  plan,
  runStatus,
}: {
  plan: WorkoutPlan | null;
  runStatus: PlanChatRunStatus | null;
}) {
  const showSpinner = shouldShowPreviewSpinner(runStatus);

  if (!plan) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto">
        {showSpinner ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Spinner label="Building plan" />
          </div>
        ) : null}
        <EmptyState
          title="Plan preview"
          description="Your workout plan will appear here after a successful run."
        />
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-y-auto p-4 md:p-6">
      {showSpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Spinner label="Updating plan" />
        </div>
      ) : null}
      <PlanViewer plan={plan} view="coach" />
    </div>
  );
}
