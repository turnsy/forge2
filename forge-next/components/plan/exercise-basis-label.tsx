import { getExerciseBasisLabel } from "@/lib/plans/display";
import type { Exercise } from "@/lib/plans/workout-plan";

export function ExerciseBasisLabel({ exercise }: { exercise: Exercise }) {
  const basis = getExerciseBasisLabel(exercise);
  if (!basis) return null;

  return <p className="text-sm text-surface-muted">Basis: {basis}</p>;
}
