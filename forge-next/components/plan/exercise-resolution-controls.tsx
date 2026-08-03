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
  const customBasis = hasCustomBasis(exercise);
  const [manualBasisOpen, setManualBasisOpen] = useState(false);
  const basisOpen = customBasis || manualBasisOpen;

  function toggleBasis() {
    if (basisOpen) {
      onChange({
        ...exercise,
        basisRaw: undefined,
        resolvedBasisExerciseId: undefined,
      });
      setManualBasisOpen(false);
      return;
    }

    setManualBasisOpen(true);
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
          variant={basisOpen ? "secondary" : "ghost"}
          size="sm"
          fullWidth={false}
          disabled={disabled}
          aria-label="Toggle percentage basis exercise"
          aria-pressed={basisOpen}
          className="mt-1 shrink-0"
          onClick={toggleBasis}
        >
          Basis
        </Button>
      </div>
      {basisOpen ? (
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
              setManualBasisOpen(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
