"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import {
  confirmExerciseCandidate,
  ExerciseSearchField,
} from "@/components/plan/exercise-search-field";
import type { Exercise } from "@/lib/plans/workout-plan";

function hasCustomBasis(exercise: Exercise): boolean {
  const basisName = exercise.basisRaw?.trim();
  if (!basisName) return false;
  return basisName.toLowerCase() !== exercise.name.trim().toLowerCase();
}

export function ExerciseResolutionControls({
  exercise,
  disabled,
  onChange,
}: {
  exercise: Exercise;
  disabled: boolean;
  onChange: (next: Exercise) => void;
}) {
  const [basisModalOpen, setBasisModalOpen] = useState(false);
  const [basisDraftName, setBasisDraftName] = useState("");
  const [basisDraftId, setBasisDraftId] = useState<string | null>(null);
  const customBasis = hasCustomBasis(exercise);
  const basisLabel = exercise.basisRaw ?? exercise.name;

  function openBasisModal() {
    setBasisDraftName(basisLabel);
    setBasisDraftId(exercise.resolvedBasisExerciseId ?? exercise.resolvedExerciseId ?? null);
    setBasisModalOpen(true);
  }

  function closeBasisModal() {
    setBasisModalOpen(false);
    setBasisDraftName("");
    setBasisDraftId(null);
  }

  async function saveBasisModal() {
    const trimmed = basisDraftName.trim();
    if (!trimmed) {
      closeBasisModal();
      return;
    }

    const sameAsExercise = trimmed.toLowerCase() === exercise.name.trim().toLowerCase();
    if (sameAsExercise) {
      onChange({
        ...exercise,
        basisRaw: undefined,
        resolvedBasisExerciseId: undefined,
      });
      closeBasisModal();
      return;
    }

    let exerciseId = basisDraftId;
    if (!exerciseId) {
      const confirmed = await confirmExerciseCandidate({ name: trimmed });
      exerciseId = confirmed?.id ?? null;
    }

    if (!exerciseId) {
      return;
    }

    onChange({
      ...exercise,
      basisRaw: trimmed,
      resolvedBasisExerciseId: exerciseId,
    });
    closeBasisModal();
  }

  function clearBasis() {
    onChange({
      ...exercise,
      basisRaw: undefined,
      resolvedBasisExerciseId: undefined,
    });
    closeBasisModal();
  }

  return (
    <>
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
            variant={customBasis ? "secondary" : "ghost"}
            size="sm"
            fullWidth={false}
            disabled={disabled}
            aria-label="Set percentage basis exercise"
            className="mt-1 shrink-0"
            onClick={openBasisModal}
          >
            Basis
          </Button>
        </div>
        {customBasis ? (
          <p className="text-xs text-surface-muted">
            Percentage basis: <span className="font-medium text-surface-foreground">{basisLabel}</span>
          </p>
        ) : null}
      </div>

      <Modal
        open={basisModalOpen}
        title="Percentage basis exercise"
        size="large"
        onClose={closeBasisModal}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {customBasis ? (
              <Button
                type="button"
                variant="ghost"
                fullWidth={false}
                onClick={clearBasis}
              >
                Use exercise name
              </Button>
            ) : null}
            <Button type="button" variant="secondary" fullWidth={false} onClick={closeBasisModal}>
              Cancel
            </Button>
            <Button
              type="button"
              fullWidth={false}
              disabled={!basisDraftName.trim()}
              onClick={() => void saveBasisModal()}
            >
              Save
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-surface-muted">
          Choose which exercise max to use when this movement is prescribed as a percentage
          (for example, Front Squat at a percentage of Back Squat).
        </p>
        <ExerciseSearchField
          key={basisModalOpen ? `basis-modal:${basisLabel}` : "basis-modal-closed"}
          label="Percentage basis exercise"
          value={basisDraftName}
          disabled={false}
          autoFocus
          onResolved={({ name, exerciseId }) => {
            setBasisDraftName(name);
            setBasisDraftId(exerciseId);
          }}
        />
      </Modal>
    </>
  );
}
