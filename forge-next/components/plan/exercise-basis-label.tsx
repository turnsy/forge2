import { getExerciseBasisLabel } from "@/lib/plans/display";
import type { Exercise } from "@/lib/plans/workout-plan";

export function ExerciseBasisLabel({ exercise }: { exercise: Exercise }) {
  return (
    <p className="text-sm text-surface-muted">
      Basis: {getExerciseBasisLabel(exercise)}
    </p>
  );
}
