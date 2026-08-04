"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CoachAthleteMaxFormModal,
  type MaxFormEntry,
} from "@/components/coach-athlete-max-form-modal";
import {
  Button,
  EmptyState,
  Input,
  List,
  ListRow,
  ListSectionSpinner,
  Message,
  MetaGroup,
  MetaItem,
  PageBackButton,
} from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import {
  filterMaxSummaries,
  groupMaxesByExercise,
  type AthleteMaxEntry,
  type ExerciseMaxSummary,
} from "@/lib/maxes/group-by-exercise";

async function fetchMaxes(listUrl: string): Promise<AthleteMaxEntry[]> {
  const response = await fetch(listUrl);
  if (!response.ok) {
    throw new Error("Could not load maxes.");
  }

  const result = (await response.json()) as { maxes?: AthleteMaxEntry[] };
  return (result.maxes ?? []).map((max) => ({
    ...max,
    exercise_name: max.exercise_name ?? max.exercise_id,
  }));
}

function CoachAthleteMaxHistoryPanel({
  summary,
  onBack,
  onUpdateMax,
}: {
  summary: ExerciseMaxSummary;
  onBack: () => void;
  onUpdateMax: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PageBackButton ariaLabel="Back to maxes" onClick={onBack} />
          <h2 className="truncate text-lg font-semibold text-surface-foreground">
            {summary.exerciseName}
          </h2>
        </div>
        <Button type="button" variant="secondary" size="sm" fullWidth={false} onClick={onUpdateMax}>
          Update max
        </Button>
      </div>
      <List>
        {summary.history.map((entry, index) => (
          <ListRow
            key={entry.id}
            appearIndex={index}
            leading={
              <p className="text-base font-semibold text-surface-foreground">
                {entry.value} {entry.unit}
              </p>
            }
            meta={
              <MetaGroup>
                <MetaItem label="Recorded" value={formatDate(entry.logged_at)} />
              </MetaGroup>
            }
          />
        ))}
      </List>
    </div>
  );
}

export function CoachAthleteMaxesTab({
  listUrl,
  saveUrl,
  searchUrl,
  confirmUrl,
}: {
  listUrl: string;
  saveUrl: string;
  searchUrl?: string;
  confirmUrl?: string;
}) {
  const [maxes, setMaxes] = useState<AthleteMaxEntry[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadedListUrl, setLoadedListUrl] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "update">("add");
  const [formEntry, setFormEntry] = useState<MaxFormEntry | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const isLoading = loadedListUrl !== listUrl;

  useEffect(() => {
    let cancelled = false;

    void fetchMaxes(listUrl)
      .then((entries) => {
        if (!cancelled) {
          setMaxes(entries);
          setError(null);
          setLoadedListUrl(listUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load maxes.");
          setLoadedListUrl(listUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [listUrl]);

  async function refreshMaxes() {
    try {
      setMaxes(await fetchMaxes(listUrl));
      setError(null);
    } catch {
      setError("Could not load maxes.");
    }
  }

  function openAddModal() {
    setFormMode("add");
    setFormEntry(null);
    setFormOpen(true);
  }

  function openUpdateModal(summary: ExerciseMaxSummary) {
    setFormMode("update");
    setFormEntry({
      exerciseId: summary.exerciseId,
      exerciseName: summary.exerciseName,
      value: summary.currentValue,
      unit: summary.currentUnit,
    });
    setFormOpen(true);
  }

  const summaries = useMemo(() => groupMaxesByExercise(maxes), [maxes]);
  const filteredSummaries = useMemo(
    () => filterMaxSummaries(summaries, query),
    [summaries, query],
  );
  const selectedSummary =
    summaries.find((summary) => summary.exerciseId === selectedExerciseId) ?? null;

  if (selectedSummary) {
    return (
      <>
        <CoachAthleteMaxHistoryPanel
          summary={selectedSummary}
          onBack={() => setSelectedExerciseId(null)}
          onUpdateMax={() => openUpdateModal(selectedSummary)}
        />
        <CoachAthleteMaxFormModal
          open={formOpen}
          mode={formMode}
          initialEntry={formEntry}
          saveUrl={saveUrl}
          searchUrl={searchUrl}
          confirmUrl={confirmUrl}
          onClose={() => setFormOpen(false)}
          onSaved={() => void refreshMaxes()}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          aria-label="Search maxes"
          placeholder="Search exercises"
          value={query}
          className="min-w-0 flex-1"
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="button" fullWidth={false} onClick={openAddModal}>
          Add max
        </Button>
      </div>

      {error ? <Message tone="error">{error}</Message> : null}

      {isLoading ? (
        <ListSectionSpinner />
      ) : filteredSummaries.length === 0 ? (
        <EmptyState
          title={query.trim() ? "No matching maxes" : "No maxes yet"}
          description={
            query.trim()
              ? "Try a different exercise name."
              : "Add a tested or current max for this athlete."
          }
          action={
            query.trim() ? undefined : (
              <Button type="button" onClick={openAddModal}>
                Add max
              </Button>
            )
          }
        />
      ) : (
        <List>
          {filteredSummaries.map((summary, index) => (
            <ListRow
              key={summary.exerciseId}
              appearIndex={index}
              leading={
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setSelectedExerciseId(summary.exerciseId)}
                >
                  <h2 className="truncate text-base font-semibold text-surface-foreground">
                    {summary.exerciseName}
                  </h2>
                </button>
              }
              meta={
                <MetaGroup>
                  <MetaItem
                    label="Current max"
                    value={`${summary.currentValue} ${summary.currentUnit}`}
                  />
                  <MetaItem label="Updated" value={formatDate(summary.loggedAt)} />
                </MetaGroup>
              }
            />
          ))}
        </List>
      )}

      <CoachAthleteMaxFormModal
        open={formOpen}
        mode={formMode}
        initialEntry={formEntry}
        saveUrl={saveUrl}
        searchUrl={searchUrl}
        confirmUrl={confirmUrl}
        onClose={() => setFormOpen(false)}
        onSaved={() => void refreshMaxes()}
      />
    </div>
  );
}
