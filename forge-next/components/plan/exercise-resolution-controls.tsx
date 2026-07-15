"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui";
import type { Exercise } from "@/lib/plans/workout-plan";

type Candidate = { id: string; name: string };

export function ExerciseResolutionControls({
  exercise,
  disabled,
  onChange,
}: {
  exercise: Exercise;
  disabled: boolean;
  onChange: (next: Exercise) => void;
}) {
  const listId = useId();
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    let cancelled = false;
    const query = exercise.name.trim();
    if (!query) return;
    void fetch("/api/coach/exercises/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((response) => (response.ok ? response.json() : { exercises: [] }))
      .then((result: { exercises?: Candidate[] }) => {
        if (!cancelled) setCandidates((result.exercises ?? []).slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [exercise.name]);

  function select(value: string) {
    const candidate = candidates.find((item) => item.name === value);
    if (candidate) {
      onChange({ ...exercise, resolvedExerciseId: candidate.id });
    } else {
      onChange({ ...exercise, name: value, resolvedExerciseId: undefined });
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <Input
          value={exercise.name}
          readOnly={disabled}
          list={listId}
          aria-label="Exercise"
          className="font-semibold"
          onChange={(event) => select(event.target.value)}
        />
        <datalist id={listId}>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.name} />
          ))}
        </datalist>
      </div>
      <Input
        value={exercise.basisRaw ?? ""}
        readOnly={disabled}
        placeholder={`% of ${exercise.name}`}
        aria-label="Percentage basis exercise"
        onChange={(event) =>
          onChange({
            ...exercise,
            basisRaw: event.target.value || undefined,
            resolvedBasisExerciseId: undefined,
          })
        }
      />
    </div>
  );
}
