import { WorkoutPlanArtifactPreview } from "@/components/artifact/workout-plan-artifact-preview";
import { Spinner } from "@/components/ui";
import { getRunStatusLabel } from "@/lib/chat/run-status-copy";
import type { ChatStatus } from "@/lib/chat/types";
import type { ArtifactPreviewModel } from "@/lib/plan-chat/artifact-preview";

function PreviewLoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6 text-center">
      <Spinner className="h-8 w-8" label={label} />
      <p className="text-sm text-surface-muted">{label}</p>
    </div>
  );
}

export function ArtifactPreview({
  artifact,
  runStatus,
  isAwaitingArtifact,
}: {
  artifact: ArtifactPreviewModel;
  runStatus: ChatStatus | null;
  isAwaitingArtifact: boolean;
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
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
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
        />
      );
    default: {
      const _exhaustive: never = artifact;
      return _exhaustive;
    }
  }
}
