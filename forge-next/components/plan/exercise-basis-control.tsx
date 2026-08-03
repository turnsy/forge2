"use client";

import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import { getEffectiveExerciseBasis } from "@/lib/plans/display";
import type { Exercise } from "@/lib/plans/workout-plan";

export function ExerciseBasisControl({
  exercise,
  disabled,
  onChange,
}: {
  exercise: Exercise;
  disabled: boolean;
  onChange: (next: Exercise) => void;
}) {
  const effectiveBasis = getEffectiveExerciseBasis(exercise);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-surface-muted">
        Basis
      </span>
      <div className="min-w-0 flex-1">
        <ExerciseSearchField
          key={`basis:${effectiveBasis}:${exercise.resolvedBasisExerciseId ?? ""}:${exercise.name}`}
          label="Percentage basis exercise"
          value={effectiveBasis}
          disabled={disabled}
          onResolved={({ name, exerciseId }) => {
            const sameAsExercise =
              name.trim().toLowerCase() === exercise.name.trim().toLowerCase();
            onChange({
              ...exercise,
              basisRaw: sameAsExercise ? undefined : name,
              resolvedBasisExerciseId: sameAsExercise ? undefined : exerciseId,
            });
          }}
        />
      </div>
    </div>
  );
}
