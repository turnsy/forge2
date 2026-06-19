import { WorkoutPlanArtifactPreview } from "@/components/artifact/workout-plan-artifact-preview";
import { Spinner } from "@/components/ui";
import { getRunStatusLabel } from "@/lib/chat/run-status-copy";
import type { ArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import type { ChatStatus } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function PreviewLoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <Spinner className="h-8 w-8" label={label} />
      <p className="text-sm text-surface-muted">{label}</p>
    </div>
  );
}

export function ArtifactPreview({
  artifact,
  runStatus,
  isAwaitingArtifact,
  disabled,
  onPlanChange,
}: {
  artifact: ArtifactPreviewModel;
  runStatus: ChatStatus | null;
  isAwaitingArtifact: boolean;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
}) {
  if (!artifact) {
    if (isAwaitingArtifact) {
      const label =
        runStatus && runStatus !== "done" && runStatus !== "error"
          ? getRunStatusLabel(runStatus)
          : "Working…";
      return <PreviewLoadingState label={label} />;
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-surface-muted">Working…</p>
      </div>
    );
  }

  switch (artifact.type) {
    case "workout-plan":
      return (
        <WorkoutPlanArtifactPreview
          plan={artifact.plan}
          runStatus={runStatus}
          disabled={disabled}
          onPlanChange={onPlanChange}
        />
      );
    default: {
      const _exhaustive: never = artifact.type;
      return _exhaustive;
    }
  }
}
