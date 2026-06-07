"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AssignmentModalFooter } from "@/components/assignment-modal-footer";
import { InfiniteScrollSentinel } from "@/components/list/infinite-scroll-sentinel";
import { ModalListLoading } from "@/components/list/modal-list-loading";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Input, Message } from "@/components/ui";
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
    isLoadingMore,
    isListLoading,
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
      size="large"
      bodyClassName="flex min-h-0 flex-col gap-4 overflow-hidden"
      footer={
        <AssignmentModalFooter
          pending={pending}
          loading={loading}
          onCancel={onClose}
          onConfirm={handleAssign}
          confirmLabel="Assign"
          pendingLabel="Assigning…"
        />
      }
    >
      <div className="shrink-0">
        <Input
          type="search"
          value={search}
          placeholder="Search"
          aria-label="Search athletes"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-glass-border bg-glass shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md">
        {isListLoading ? (
          <ModalListLoading />
        ) : error ? (
          <div className="p-4">
            <Message tone="error">{error}</Message>
          </div>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-surface-muted">No athletes found.</p>
        ) : (
          <ul className="divide-y divide-glass-border">
            {items.map((athlete) => {
              const checked = selectedIds.has(athlete.id);

              return (
                <li key={athlete.id}>
                  <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-glass-focus/40">
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleAthlete(athlete)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-surface-foreground">
                        {athlete.name}
                      </span>
                      {athlete.email ? (
                        <span className="block truncate text-xs text-surface-muted">
                          {athlete.email}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-xs text-surface-muted">
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
        <div className="shrink-0">
          <Message tone="info">
            Some selected athletes already have a different active plan. Assigning
            will replace their current assignment with a fresh copy of this plan.
          </Message>
        </div>
      ) : null}

      {actionError ? (
        <div className="shrink-0">
          <Message tone="error">{actionError}</Message>
        </div>
      ) : null}
    </Modal>
  );
}
