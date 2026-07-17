"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui";
import type { Exercise } from "@/lib/plans/workout-plan";

type Candidate = { id: string; name: string };

async function searchCandidates(query: string): Promise<Candidate[]> {
  if (!query.trim()) return [];
  const response = await fetch("/api/coach/exercises/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) return [];
  const result = (await response.json()) as { exercises?: Candidate[] };
  return (result.exercises ?? []).slice(0, 5);
}

async function confirmExercise(input: {
  exerciseId?: string;
  name?: string;
}): Promise<Candidate | null> {
  const response = await fetch("/api/coach/exercises/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  const result = (await response.json()) as { exercise?: Candidate };
  return result.exercise ?? null;
}

function ExerciseCombobox({
  label,
  value,
  disabled,
  onResolved,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onResolved: (next: { name: string; exerciseId: string }) => void;
}) {
  const listId = useId();
  const [draft, setDraft] = useState(value);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    void searchCandidates(draft).then((results) => {
      if (!cancelled) setCandidates(results);
    });
    return () => {
      cancelled = true;
    };
  }, [draft]);

  async function commit(nextValue: string, candidate?: Candidate) {
    const trimmed = nextValue.trim();
    if (!trimmed) return;

    if (candidate) {
      onResolved({ name: candidate.name, exerciseId: candidate.id });
      setDraft(candidate.name);
      return;
    }

    const matched = candidates.find(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matched) {
      onResolved({ name: matched.name, exerciseId: matched.id });
      setDraft(matched.name);
      return;
    }

    const confirmed = await confirmExercise({ name: trimmed });
    if (confirmed) {
      onResolved({ name: confirmed.name, exerciseId: confirmed.id });
      setDraft(confirmed.name);
    }
  }

  return (
    <div>
      <Input
        value={draft}
        readOnly={disabled}
        list={listId}
        aria-label={label}
        className="font-semibold"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit(draft);
          }
        }}
      />
      <datalist id={listId}>
        {candidates.map((candidate) => (
          <option key={candidate.id} value={candidate.name} />
        ))}
      </datalist>
    </div>
  );
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
  const basisValue = exercise.basisRaw ?? exercise.name;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ExerciseCombobox
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
      <ExerciseCombobox
        label="Percentage basis exercise"
        value={basisValue}
        disabled={disabled}
        onResolved={({ name, exerciseId }) => {
          const sameAsExercise = name.trim().toLowerCase() === exercise.name.trim().toLowerCase();
          onChange({
            ...exercise,
            basisRaw: sameAsExercise ? undefined : name,
            resolvedBasisExerciseId: sameAsExercise ? undefined : exerciseId,
          });
        }}
      />
    </div>
  );
}
