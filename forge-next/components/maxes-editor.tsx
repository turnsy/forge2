"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Message } from "@/components/ui";

type MaxRow = {
  id: string;
  exercise_id: string;
  value: number;
  unit: string;
  source: string;
  logged_at: string;
};

type MaxesEditorProps = {
  listUrl: string;
  saveUrl: string;
  title: string;
  description: string;
  enableExerciseSearch?: boolean;
};

export function MaxesEditor({
  listUrl,
  saveUrl,
  title,
  description,
  enableExerciseSearch = false,
}: MaxesEditorProps) {
  const [maxes, setMaxes] = useState<MaxRow[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    void fetch(listUrl)
      .then((response) => response.json())
      .then((result) => setMaxes(result.maxes ?? []))
      .catch(() => setError("Could not load maxes."));
  }, [listUrl]);

  useEffect(() => {
    if (!enableExerciseSearch || !exerciseQuery.trim()) {
      setCandidates([]);
      return;
    }
    void fetch("/api/coach/exercises/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: exerciseQuery }),
    })
      .then((response) => (response.ok ? response.json() : { exercises: [] }))
      .then((result) => setCandidates((result.exercises ?? []).slice(0, 5)))
      .catch(() => setCandidates([]));
  }, [enableExerciseSearch, exerciseQuery]);

  async function save() {
    setError(null);
    const response = await fetch(saveUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        exerciseId,
        value: Number(value),
        unit,
        source: "tested",
      }),
    });
    if (!response.ok) {
      setError("Could not save max.");
      return;
    }
    const result = await response.json();
    setMaxes((current) => [result.max, ...current]);
    setExerciseQuery("");
    setExerciseId("");
    setValue("");
  }

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-surface-foreground">{title}</h1>
        <p className="text-sm text-surface-muted">{description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_7rem_6rem_auto]">
        <Input
          aria-label="Exercise"
          placeholder={enableExerciseSearch ? "Search exercise" : "Exercise id"}
          value={exerciseQuery}
          list={enableExerciseSearch ? "max-exercise-options" : undefined}
          onChange={(event) => {
            setExerciseQuery(event.target.value);
            if (enableExerciseSearch) {
              const match = candidates.find(
                (candidate) =>
                  candidate.name.toLowerCase() === event.target.value.trim().toLowerCase(),
              );
              setExerciseId(match?.id ?? "");
            } else {
              setExerciseId(event.target.value.trim());
            }
          }}
        />
        {enableExerciseSearch ? (
          <datalist id="max-exercise-options">
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.name} />
            ))}
          </datalist>
        ) : null}
        <Input
          aria-label="Max value"
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Input aria-label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)} />
        <Button
          type="button"
          onClick={() => void save()}
          disabled={!exerciseId || !value}
        >
          Add
        </Button>
      </div>
      {error ? <Message tone="error">{error}</Message> : null}
      <ul className="space-y-2 text-sm text-surface-foreground">
        {maxes.map((max) => (
          <li key={max.id}>
            {max.exercise_id}: {max.value} {max.unit} ({max.source})
          </li>
        ))}
      </ul>
    </Card>
  );
}
