import { getExerciseBasisLabel, exerciseHasPercentageSets } from "@/lib/plans/display";
import type { Exercise } from "@/lib/plans/workout-plan";

export function ExerciseBasisLabel({ exercise }: { exercise: Exercise }) {
  if (!exerciseHasPercentageSets(exercise)) {
    return null;
  }

  return (
    <p className="text-sm text-surface-muted">
      Basis: {getExerciseBasisLabel(exercise)}
    </p>
  );
}
