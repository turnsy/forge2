import { WorkoutPlanArtifactPreview } from "@/components/artifact/workout-plan-artifact-preview";
import { TurnActivityIndicator } from "@/components/chat/turn-activity-indicator";
import type { ArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import { isTurnInProgress, getTurnActivityLabel } from "@/lib/chat/turn-activity";
import type { ChatStatus, ChatWorkspacePhase } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function ArtifactPreview({
  artifact,
  runStatus,
  phase = "idle",
  isAwaitingArtifact,
  disabled,
  onPlanChange,
  embeddedScroll = false,
}: {
  artifact: ArtifactPreviewModel;
  runStatus: ChatStatus | null;
  phase?: ChatWorkspacePhase;
  isAwaitingArtifact: boolean;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  embeddedScroll?: boolean;
}) {
  const turnInProgress = isTurnInProgress(phase, runStatus);
  const activityLabel = turnInProgress
    ? getTurnActivityLabel(phase, runStatus)
    : null;

  if (!artifact) {
    if (isAwaitingArtifact && activityLabel) {
      return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
          <TurnActivityIndicator align="center" label={activityLabel} />
        </div>
      );
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
          phase={phase}
          disabled={disabled}
          onPlanChange={onPlanChange}
          embeddedScroll={embeddedScroll}
        />
      );
    default: {
      const _exhaustive: never = artifact.type;
      return _exhaustive;
    }
  }
}
