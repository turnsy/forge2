"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui";

const SEARCH_DEBOUNCE_MS = 300;

export type ExerciseSearchCandidate = { id: string; name: string };

async function searchCandidates(query: string): Promise<ExerciseSearchCandidate[]> {
  const response = await fetch("/api/coach/exercises/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) return [];
  const result = (await response.json()) as { exercises?: ExerciseSearchCandidate[] };
  return (result.exercises ?? []).slice(0, 5);
}

async function confirmExerciseCandidate(input: {
  exerciseId?: string;
  name?: string;
}): Promise<ExerciseSearchCandidate | null> {
  const response = await fetch("/api/coach/exercises/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  const result = (await response.json()) as { exercise?: ExerciseSearchCandidate };
  return result.exercise ?? null;
}

export function shouldOfferCustomExerciseEntry(
  query: string,
  candidates: ExerciseSearchCandidate[],
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  return !candidates.some(
    (candidate) => candidate.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
}

export function ExerciseSearchField({
  label,
  value,
  disabled,
  revertOnBlur = true,
  onResolved,
}: {
  label: string;
  value: string;
  disabled: boolean;
  revertOnBlur?: boolean;
  onResolved: (next: { name: string; exerciseId: string }) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(value);
  const [typedQuery, setTypedQuery] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ExerciseSearchCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (typedQuery === null) {
      return;
    }

    const trimmed = typedQuery.trim();
    if (!trimmed) {
      return;
    }

    const requestId = ++requestIdRef.current;

    const timer = window.setTimeout(() => {
      setIsSearching(true);
      void searchCandidates(trimmed)
        .then((results) => {
          if (requestIdRef.current !== requestId) return;
          setCandidates(results);
          setIsSearching(false);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setCandidates([]);
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [typedQuery]);

  function closeDropdown() {
    setIsOpen(false);
    setTypedQuery(null);
    setCandidates([]);
    setIsSearching(false);
  }

  function handleSelect(candidate: ExerciseSearchCandidate) {
    closeDropdown();
    setDraft(candidate.name);
    onResolved({ name: candidate.name, exerciseId: candidate.id });
  }

  async function handleCreateCustom() {
    const trimmed = draft.trim();
    if (!trimmed || isCreating) return;

    setIsCreating(true);
    try {
      const confirmed = await confirmExerciseCandidate({ name: trimmed });
      if (confirmed) {
        closeDropdown();
        setDraft(confirmed.name);
        onResolved({ name: confirmed.name, exerciseId: confirmed.id });
      }
    } finally {
      setIsCreating(false);
    }
  }

  const trimmedQuery = typedQuery?.trim() ?? "";
  const showResults = isOpen && trimmedQuery.length > 0;
  const showCreateCustom =
    showResults &&
    !isSearching &&
    shouldOfferCustomExerciseEntry(trimmedQuery, candidates);

  return (
    <div ref={rootRef} className="relative">
      <Input
        value={draft}
        readOnly={disabled}
        aria-label={label}
        aria-expanded={showResults}
        aria-controls={showResults ? listboxId : undefined}
        aria-autocomplete="list"
        role="combobox"
        className="font-semibold"
        onFocus={() => {
          setIsOpen(true);
        }}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (nextTarget && rootRef.current?.contains(nextTarget)) {
            return;
          }

          closeDropdown();
          if (revertOnBlur) {
            setDraft(value);
          }
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraft(nextValue);
          setTypedQuery(nextValue);
          setIsOpen(true);
          if (!nextValue.trim()) {
            setCandidates([]);
            setIsSearching(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeDropdown();
            setDraft(value);
          }
        }}
      />
      {showResults ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-glass-border bg-surface shadow-lg"
        >
          {isSearching ? (
            <p className="px-4 py-3 text-sm text-surface-muted">Searching…</p>
          ) : candidates.length > 0 ? (
            <ul className="py-1">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-surface-foreground transition hover:bg-glass"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(candidate)}
                  >
                    {candidate.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {showCreateCustom ? (
            <button
              type="button"
              className={`flex w-full px-4 py-2.5 text-left text-sm font-medium text-surface-foreground transition hover:bg-glass disabled:opacity-60${
                candidates.length > 0 ? " border-t border-glass-border" : ""
              }`}
              disabled={isCreating}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void handleCreateCustom()}
            >
              {isCreating ? "Creating…" : trimmedQuery}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
