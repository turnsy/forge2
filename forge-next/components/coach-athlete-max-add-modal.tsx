"use client";

import { useState } from "react";
import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

export function CoachAthleteMaxAddModal({
  open,
  saveUrl,
  searchUrl = "/api/coach/exercises/search",
  confirmUrl = "/api/coach/exercises/confirm",
  onClose,
  onSaved,
}: {
  open: boolean;
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

  function reset() {
    setExerciseName("");
    setExerciseId("");
    setValue("");
    setUnit("kg");
    setError(null);
    setIsSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(saveUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          value: Number(value),
          unit,
        }),
      });

      if (!response.ok) {
        setError("Could not save max.");
        return;
      }

      onSaved();
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Add max"
      onClose={handleClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!exerciseId || !value || isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving…" : "Save max"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
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
