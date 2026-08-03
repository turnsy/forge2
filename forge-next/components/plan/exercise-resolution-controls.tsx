"use client";

import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import type { Exercise } from "@/lib/plans/workout-plan";

export function ExerciseResolutionControls({
  exercise,
  disabled,
  onChange,
}: {
  exercise: Exercise;
  disabled: boolean;
  onChange: (next: Exercise) => void;
}) {
  return (
    <ExerciseSearchField
      key={`exercise:${exercise.name}:${exercise.resolvedExerciseId ?? ""}`}
      label="Exercise"
      value={exercise.name}
      disabled={disabled}
      onResolved={({ name, exerciseId }) =>
        onChange({
          ...exercise,
          name,
          resolvedExerciseId: exerciseId,
        })
      }
    />
  );
}
