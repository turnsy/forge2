import { PlanViewer } from "@/components/plan/plan-viewer";
import { Spinner } from "@/components/ui";
import {
  getRunStatusLabel,
  shouldShowPreviewSpinner,
} from "@/lib/chat/run-status-copy";
import type { ChatStatus } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function PreviewLoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6 text-center">
      <Spinner className="h-8 w-8" label={label} />
      <p className="text-sm text-surface-muted">{label}</p>
    </div>
  );
}

/** @deprecated Use ArtifactPreview — kept briefly for plan workspace during migration */
export function PlanWorkspacePreview({
  plan,
  runStatus,
  isAwaitingArtifact,
}: {
  plan: WorkoutPlan | null;
  runStatus: ChatStatus | null;
  isAwaitingArtifact: boolean;
}) {
  const showOverlaySpinner = plan !== null && shouldShowPreviewSpinner(runStatus);

  if (!plan) {
    if (isAwaitingArtifact) {
      const label =
        runStatus && runStatus !== "done" && runStatus !== "error"
          ? getRunStatusLabel(runStatus)
          : "Working…";
      return <PreviewLoadingState label={label} />;
    }

    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-surface-muted">Working…</p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-y-auto">
      {showOverlaySpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Spinner label="Working…" />
        </div>
      ) : null}
      <PlanViewer plan={plan} view="coach" />
    </div>
  );
}
