"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InfiniteScrollSentinel } from "@/components/list/infinite-scroll-sentinel";
import { Modal } from "@/components/ui/modal";
import { Button, Input, Message } from "@/components/ui";
import type { CoachAthleteListItem } from "@/lib/athletes/types";
import { fetchPaginatedJson } from "@/lib/lists/fetch-paginated";
import { useInfiniteList } from "@/lib/lists/use-infinite-list";
import { assignPlanToAthletesAction } from "@/lib/plans/actions";
import { hasAthletesWithDifferentActivePlan } from "@/lib/plans/assignment";

export function PlanAssignAthletesModal({
  planId,
  planTitle,
  onClose,
}: {
  planId: string;
  planTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [manualSelectedIds, setManualSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [manualDeselectedIds, setManualDeselectedIds] = useState<Set<string>>(
    new Set(),
  );

  const fetchAthletes = useCallback(
    (query: { q?: string; page: number; limit: number }) =>
      fetchPaginatedJson<CoachAthleteListItem>("/api/coach/athletes", query),
    [],
  );

  const {
    items,
    search,
    setSearch,
    loading,
    error,
    hasMore,
    loadMore,
    isInitialLoading,
    isLoadingMore,
  } = useInfiniteList({
    fetchPage: fetchAthletes,
  });

  const selectedIds = useMemo(() => {
    const ids = new Set(manualSelectedIds);

    for (const athlete of items) {
      if (
        athlete.currentPlanId === planId &&
        !manualDeselectedIds.has(athlete.id)
      ) {
        ids.add(athlete.id);
      }
    }

    return ids;
  }, [items, manualDeselectedIds, manualSelectedIds, planId]);

  const showReassignWarning = useMemo(
    () => hasAthletesWithDifferentActivePlan(items, selectedIds, planId),
    [items, planId, selectedIds],
  );

  function toggleAthlete(athlete: CoachAthleteListItem) {
    const isSelected = selectedIds.has(athlete.id);

    if (isSelected) {
      if (athlete.currentPlanId === planId) {
        setManualDeselectedIds((current) => new Set(current).add(athlete.id));
      }

      setManualSelectedIds((current) => {
        const next = new Set(current);
        next.delete(athlete.id);
        return next;
      });
      return;
    }

    setManualDeselectedIds((current) => {
      if (!current.has(athlete.id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(athlete.id);
      return next;
    });
    setManualSelectedIds((current) => new Set(current).add(athlete.id));
  }

  function handleAssign() {
    setActionError(null);

    if (selectedIds.size === 0) {
      setActionError("Select at least one athlete.");
      return;
    }

    startTransition(async () => {
      const result = await assignPlanToAthletesAction(
        planId,
        Array.from(selectedIds),
      );

      if (!result.ok) {
        setActionError(result.error ?? "Could not assign plan.");
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open
      title={`Assign “${planTitle}”`}
      onClose={onClose}
      size="lg"
    >
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Select athletes to assign this plan. Athletes already on this plan are
        pre-selected.
      </p>

      <div className="mb-4">
        <Input
          type="search"
          value={search}
          placeholder="Search athletes"
          aria-label="Search athletes"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        {isInitialLoading ? (
          <p className="p-4 text-sm text-zinc-500">Loading athletes…</p>
        ) : error ? (
          <Message tone="error">{error}</Message>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">No athletes found.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {items.map((athlete) => {
              const checked = selectedIds.has(athlete.id);

              return (
                <li key={athlete.id}>
                  <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => toggleAthlete(athlete)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {athlete.name}
                      </span>
                      {athlete.email ? (
                        <span className="block truncate text-xs text-zinc-500">
                          {athlete.email}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-xs text-zinc-500">
                        Current plan: {athlete.currentPlanName ?? "No plan"}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <InfiniteScrollSentinel
          hasMore={hasMore}
          loading={isLoadingMore}
          onLoadMore={loadMore}
        />
      </div>

      {showReassignWarning ? (
        <div className="mt-4">
          <Message tone="info">
            Some selected athletes already have a different active plan. Assigning
            will replace their current assignment with a fresh copy of this plan.
          </Message>
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4">
          <Message tone="error">{actionError}</Message>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          disabled={pending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          fullWidth={false}
          disabled={pending || loading}
          onClick={handleAssign}
        >
          {pending ? "Assigning…" : "Assign"}
        </Button>
      </div>
    </Modal>
  );
}
