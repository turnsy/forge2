"use client";

import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import { NEW_EXERCISE_PLACEHOLDER } from "@/lib/plans/plan-defaults";
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
      key={`exercise:${exercise.id}:${exercise.name}:${exercise.resolvedExerciseId ?? ""}`}
      label="Exercise"
      value={exercise.name}
      placeholder={NEW_EXERCISE_PLACEHOLDER}
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
