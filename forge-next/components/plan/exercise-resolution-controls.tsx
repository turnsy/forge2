"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import { hasCustomBasis } from "@/lib/plans/display";
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
  const hasBasis = hasCustomBasis(exercise);
  const [basisFieldOpen, setBasisFieldOpen] = useState(hasBasis);

  function toggleBasis() {
    setBasisFieldOpen((open) => !open);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
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
        </div>
        <Button
          type="button"
          variant={hasBasis || basisFieldOpen ? "secondary" : "ghost"}
          size="sm"
          fullWidth={false}
          disabled={disabled}
          aria-label="Toggle percentage basis exercise"
          aria-pressed={basisFieldOpen}
          className="mt-1 shrink-0"
          onClick={toggleBasis}
        >
          Basis
        </Button>
      </div>
      {basisFieldOpen ? (
        <ExerciseSearchField
          key={`basis:${exercise.basisRaw ?? ""}:${exercise.resolvedBasisExerciseId ?? ""}`}
          label="Percentage basis exercise"
          value={exercise.basisRaw ?? ""}
          disabled={disabled}
          onResolved={({ name, exerciseId }) => {
            const sameAsExercise =
              name.trim().toLowerCase() === exercise.name.trim().toLowerCase();
            onChange({
              ...exercise,
              basisRaw: sameAsExercise ? undefined : name,
              resolvedBasisExerciseId: sameAsExercise ? undefined : exerciseId,
            });
            if (sameAsExercise) {
              setBasisFieldOpen(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
