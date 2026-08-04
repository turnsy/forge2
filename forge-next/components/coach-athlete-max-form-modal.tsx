"use client";

import { useEffect, useState } from "react";
import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

export type MaxFormEntry = {
  exerciseName: string;
  exerciseId: string;
  value: number;
  unit: string;
};

export function CoachAthleteMaxFormModal({
  open,
  mode,
  initialEntry = null,
  saveUrl,
  searchUrl = "/api/coach/exercises/search",
  confirmUrl = "/api/coach/exercises/confirm",
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "add" | "update";
  initialEntry?: MaxFormEntry | null;
  saveUrl: string;
  searchUrl?: string;
  confirmUrl?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "update" && initialEntry) {
      setExerciseName(initialEntry.exerciseName);
      setExerciseId(initialEntry.exerciseId);
      setValue(String(initialEntry.value));
      setUnit(initialEntry.unit);
    } else {
      setExerciseName("");
      setExerciseId("");
      setValue("");
      setUnit("kg");
    }

    setError(null);
    setIsSaving(false);
  }, [open, mode, initialEntry]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      const numericValue = Number(value);
      const response = await fetch(saveUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          value: numericValue,
          unit,
        }),
      });

      if (!response.ok) {
        setError(mode === "update" ? "Could not update max." : "Could not save max.");
        return;
      }

      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const title = mode === "update" ? "Update max" : "Add max";
  const saveLabel = mode === "update" ? "Save max" : "Save max";

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!value || isSaving || !exerciseId}
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving…" : saveLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {mode === "add" ? (
          <ExerciseSearchField
            label="Exercise"
            value={exerciseName}
            disabled={false}
            revertOnBlur={false}
            searchUrl={searchUrl}
            confirmUrl={confirmUrl}
            onResolved={({ name, exerciseId: nextExerciseId }) => {
              setExerciseName(name);
              setExerciseId(nextExerciseId);
            }}
          />
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-muted">
              Exercise
            </p>
            <p className="text-sm font-semibold text-surface-foreground">{exerciseName}</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            aria-label="Max value"
            type="number"
            placeholder="Max value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Input
            aria-label="Unit"
            placeholder="Unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    </Modal>
  );
}
