"use client";
import { useEffect, useState } from "react";
import { ExerciseVideoEditor } from "@/components/exercises/exercise-video-editor";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import {
  ActionGroup,
  Button,
  EmptyState,
  Input,
  List,
  ListRow,
  ListSectionSpinner,
  Message,
} from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ExerciseSearchField } from "@/components/plan/exercise-search-field";
import type { ExerciseUsage, LibraryExercise } from "@/lib/exercises/library";

async function requestJson(url: string, input?: object) {
  const response = await fetch(
    url,
    input
      ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        }
      : undefined,
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "Could not update exercises.");
  return result;
}

function DeleteExercise({
  exercise,
  onClose,
  onDeleted,
}: {
  exercise: LibraryExercise;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [usage, setUsage] = useState<ExerciseUsage | null>(null);
  const [replacement, setReplacement] = useState<LibraryExercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    requestJson(`/api/coach/exercises/${exercise.id}`)
      .then((value) => {
        if (!cancelled) setUsage(value);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [exercise.id]);
  const used = !!usage && usage.templates + usage.assignments > 0;
  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await requestJson(`/api/coach/exercises/${exercise.id}`, {
        archive: true,
        ...(replacement ? { replacementId: replacement.id } : {}),
      });
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      title={`Delete ${exercise.name}?`}
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            fullWidth={false}
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            fullWidth={false}
            disabled={
              busy ||
              !usage ||
              (used && (!replacement || replacement.id === exercise.id))
            }
            onClick={() => void remove()}
          >
            {busy ? "Deleting…" : "Delete exercise"}
          </Button>
        </div>
      }
    >
      {!usage && !error ? <ListSectionSpinner /> : null}
      {usage ? (
        <div className="space-y-4">
          <p>
            Used in {usage.templates} plan templates and {usage.assignments}{" "}
            active assignments with unfinished sets.
          </p>
          <p className="text-sm text-surface-muted">
            Recorded workouts and max history will be kept. Replacements apply
            to templates and unlogged sets in active assignments.
          </p>
          {used ? (
            <ExerciseSearchField
              label="Replacement exercise"
              value={replacement?.name ?? ""}
              disabled={busy}
              onDraftChange={() => setReplacement(null)}
              onResolved={({ exerciseId, name }) =>
                setReplacement({ id: exerciseId, name })
              }
            />
          ) : null}
        </div>
      ) : null}
      {error ? <Message tone="error">{error}</Message> : null}
    </Modal>
  );
}

export function CoachExerciseLibrary() {
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<LibraryExercise | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      requestJson(
        `/api/coach/exercises?q=${encodeURIComponent(query)}&page=${page}`,
      )
        .then((value) => {
          if (!cancelled) {
            setItems(value.exercises);
            setHasMore(value.hasMore);
            setError(null);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, page, revision]);
  async function rename(id: string) {
    setBusy(true);
    setError(null);
    try {
      await requestJson(`/api/coach/exercises/${id}`, { name: name.trim() });
      setEditing(null);
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <Input
        aria-label="Search exercises"
        placeholder="Search exercises"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
      />
      {error ? (
        <div className="space-y-2">
          <Message tone="error">{error}</Message>
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={() => setRevision((n) => n + 1)}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {loading ? (
        <ListSectionSpinner />
      ) : error && !items.length ? null : items.length === 0 ? (
        <EmptyState
          title={query ? "No matching exercises" : "No exercises yet"}
          description="Exercises appear here when you select or create them in a plan or max entry."
        />
      ) : (
        <List>
          {items.map((exercise, index) => (
            <ListRow
              key={exercise.id}
              appearIndex={index}
              leading={
                editing === exercise.id ? (
                  <Input
                    aria-label="Exercise name"
                    value={name}
                    maxLength={200}
                    disabled={busy}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim() && !busy)
                        void rename(exercise.id);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 break-words text-base font-semibold text-surface-foreground">{exercise.name}</h2>
                    <ExerciseVideoEditor
                      exerciseId={exercise.id}
                      name={exercise.name}
                      videoUrl={exercise.video_url ?? null}
                      onSaved={(url) =>
                        setItems((items) =>
                          items.map((item) =>
                            item.id === exercise.id
                              ? { ...item, video_url: url }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                )
              }
              actions={
                <ActionGroup>
                  {editing === exercise.id ? (
                    <>
                      <Button
                        fullWidth={false}
                        disabled={busy || !name.trim()}
                        onClick={() => void rename(exercise.id)}
                      >
                        Save
                      </Button>
                      <Button
                        fullWidth={false}
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        fullWidth={false}
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditing(exercise.id);
                          setName(exercise.name);
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        fullWidth={false}
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setDeleting(exercise)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </ActionGroup>
              }
            />
          ))}
        </List>
      )}
      {hasMore || page > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-4">
          {page > 1 ? (
            <Button
              fullWidth={false}
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={loading}
              onClick={() => setPage((n) => n - 1)}
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" /> Previous
            </Button>
          ) : (
            <span />
          )}
          {hasMore ? (
            <Button
              fullWidth={false}
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={!hasMore || loading}
              onClick={() => setPage((n) => n + 1)}
            >
              Next <ArrowRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
      {deleting ? (
        <DeleteExercise
          key={deleting.id}
          exercise={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setPage(1);
            setRevision((n) => n + 1);
          }}
        />
      ) : null}
    </div>
  );
}
