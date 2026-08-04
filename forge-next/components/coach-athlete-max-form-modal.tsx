"use client";

import { useState } from "react";
import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import { Button, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { WEIGHT_UNITS, type WeightUnit } from "@/lib/maxes/units";

export type MaxFormEntry = {
  exerciseName: string;
  exerciseId: string;
  value: number;
  unit: string;
};

function getInitialFormState(mode: "add" | "update", initialEntry: MaxFormEntry | null) {
  if (mode === "update" && initialEntry) {
    return {
      exerciseName: initialEntry.exerciseName,
      exerciseId: initialEntry.exerciseId,
      value: String(initialEntry.value),
      unit: initialEntry.unit as WeightUnit,
    };
  }

  return {
    exerciseName: "",
    exerciseId: "",
    value: "",
    unit: "kg" as WeightUnit,
  };
}

function CoachAthleteMaxFormFields({
  mode,
  initialEntry,
  saveUrl,
  searchUrl,
  confirmUrl,
  onClose,
  onSaved,
}: {
  mode: "add" | "update";
  initialEntry: MaxFormEntry | null;
  saveUrl: string;
  searchUrl: string;
  confirmUrl: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = getInitialFormState(mode, initialEntry);
  const [exerciseName, setExerciseName] = useState(initial.exerciseName);
  const [exerciseId, setExerciseId] = useState(initial.exerciseId);
  const [value, setValue] = useState(initial.value);
  const [unit, setUnit] = useState<WeightUnit>(initial.unit);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const saveLabel = mode === "update" ? "Save max" : "Save max";

  return (
    <>
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
          <Select
            aria-label="Unit"
            label="Unit"
            hideLabel
            value={unit}
            onChange={(event) => setUnit(event.target.value as WeightUnit)}
          >
            {WEIGHT_UNITS.map((weightUnit) => (
              <option key={weightUnit} value={weightUnit}>
                {weightUnit}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
      <div className="mt-6 flex justify-end gap-3">
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
    </>
  );
}

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
  const title = mode === "update" ? "Update max" : "Add max";
  const formKey =
    mode === "update" && initialEntry
      ? `update:${initialEntry.exerciseId}:${initialEntry.value}:${initialEntry.unit}`
      : "add";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {open ? (
        <CoachAthleteMaxFormFields
          key={formKey}
          mode={mode}
          initialEntry={initialEntry}
          saveUrl={saveUrl}
          searchUrl={searchUrl}
          confirmUrl={confirmUrl}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
