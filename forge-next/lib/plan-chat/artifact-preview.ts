import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type WorkoutPlanArtifactPreview = {
  type: "workout-plan";
  plan: WorkoutPlan;
};

export type ArtifactPreviewModel = WorkoutPlanArtifactPreview | null;

export function toArtifactPreviewModel(
  artifact: WorkoutPlan | null,
): ArtifactPreviewModel {
  if (!artifact) {
    return null;
  }

  return { type: "workout-plan", plan: artifact };
}
