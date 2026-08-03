"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Message } from "@/components/ui";
import { formatDate } from "@/lib/format/date";

type MaxRow = {
  id: string;
  exercise_id: string;
  exercise_name?: string;
  value: number;
  unit: string;
  source: string;
  logged_at: string;
};

type MaxesEditorProps = {
  listUrl: string;
  saveUrl: string;
  title?: string;
  description?: string;
  enableExerciseSearch?: boolean;
  variant?: "page" | "embedded";
};

export function MaxesEditor({
  listUrl,
  saveUrl,
  title,
  description,
  enableExerciseSearch = false,
  variant = "page",
}: MaxesEditorProps) {
  const [maxes, setMaxes] = useState<MaxRow[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string }>>([]);
  const trimmedExerciseQuery = exerciseQuery.trim();
  const shouldSearchExercises = enableExerciseSearch && trimmedExerciseQuery.length > 0;
  const visibleCandidates = shouldSearchExercises ? candidates : [];

  useEffect(() => {
    void fetch(listUrl)
      .then((response) => response.json())
      .then((result) => setMaxes(result.maxes ?? []))
      .catch(() => setError("Could not load maxes."));
  }, [listUrl]);

  useEffect(() => {
    if (!shouldSearchExercises) return;

    let cancelled = false;
    void fetch("/api/coach/exercises/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: trimmedExerciseQuery }),
    })
      .then((response) => (response.ok ? response.json() : { exercises: [] }))
      .then((result) => {
        if (!cancelled) {
          setCandidates((result.exercises ?? []).slice(0, 5));
        }
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldSearchExercises, trimmedExerciseQuery]);

  async function save() {
    setError(null);
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
    const result = (await response.json()) as { max: MaxRow };
    const matchedName = candidates.find((candidate) => candidate.id === exerciseId)?.name;
    setMaxes((current) => [
      {
        ...result.max,
        exercise_name: matchedName ?? result.max.exercise_name ?? exerciseQuery.trim(),
      },
      ...current,
    ]);
    setExerciseQuery("");
    setExerciseId("");
    setValue("");
  }

  const addForm = (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto]">
      <Input
        aria-label="Exercise"
        placeholder={enableExerciseSearch ? "Search exercise" : "Exercise id"}
        value={exerciseQuery}
        list={enableExerciseSearch ? "max-exercise-options" : undefined}
        onChange={(event) => {
          setExerciseQuery(event.target.value);
          if (enableExerciseSearch) {
            const match = visibleCandidates.find(
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
          {visibleCandidates.map((candidate) => (
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
      <Button type="button" onClick={() => void save()} disabled={!exerciseId || !value}>
        Add
      </Button>
    </div>
  );

  const table = (
    <div className="overflow-x-auto rounded-xl border border-glass-border">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-muted">
            <th className="px-4 py-3 font-medium">Exercise</th>
            <th className="px-4 py-3 font-medium">Max</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {maxes.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-surface-muted">
                No maxes recorded yet.
              </td>
            </tr>
          ) : (
            maxes.map((max) => (
              <tr key={max.id} className="border-b border-glass-border/60 last:border-b-0">
                <td className="px-4 py-3 font-medium text-surface-foreground">
                  {max.exercise_name ?? max.exercise_id}
                </td>
                <td className="px-4 py-3 text-surface-foreground">
                  {max.value} {max.unit}
                </td>
                <td className="px-4 py-3 text-surface-muted">{formatDate(max.logged_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const body = (
    <div className="space-y-4">
      {addForm}
      {error ? <Message tone="error">{error}</Message> : null}
      {table}
    </div>
  );

  if (variant === "embedded") {
    return body;
  }

  return (
    <Card className="space-y-4">
      {title ? <h1 className="text-lg font-semibold text-surface-foreground">{title}</h1> : null}
      {description ? <p className="text-sm text-surface-muted">{description}</p> : null}
      {body}
    </Card>
  );
}
