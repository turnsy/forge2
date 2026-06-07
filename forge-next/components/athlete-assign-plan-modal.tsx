"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AssignmentModalFooter } from "@/components/assignment-modal-footer";
import { InfiniteScrollSentinel } from "@/components/list/infinite-scroll-sentinel";
import { ModalListLoading } from "@/components/list/modal-list-loading";
import { Modal } from "@/components/ui/modal";
import { Input, Message, Radio } from "@/components/ui";
import { fetchPaginatedJson } from "@/lib/lists/fetch-paginated";
import { useInfiniteList } from "@/lib/lists/use-infinite-list";
import { assignPlanToAthleteAction } from "@/lib/plans/actions";
import { shouldShowAthleteReassignWarning } from "@/lib/plans/assignment";
import type { CoachPlanListItem } from "@/lib/plans/types";

export function AthleteAssignPlanModal({
  athleteId,
  athleteName,
  currentPlanName,
  onClose,
}: {
  athleteId: string;
  athleteName: string;
  currentPlanName: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const fetchPlans = useCallback(
    (query: { q?: string; page: number; limit: number }) =>
      fetchPaginatedJson<CoachPlanListItem>("/api/coach/plans", query),
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
    fetchPage: fetchPlans,
  });

  const modalTitle = shouldShowAthleteReassignWarning(currentPlanName)
    ? `Change plan for ${athleteName}`
    : `Assign plan to ${athleteName}`;

  function handleAssign() {
    setActionError(null);

    if (!selectedPlanId) {
      setActionError("Select a plan.");
      return;
    }

    startTransition(async () => {
      const result = await assignPlanToAthleteAction(selectedPlanId, athleteId);

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
      title={modalTitle}
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
      <p className="shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
        Select a plan to assign to this athlete.
      </p>

      <div className="shrink-0">
        <Input
          type="search"
          value={search}
          placeholder="Search plans"
          aria-label="Search plans"
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
          <p className="p-4 text-sm text-surface-muted">No plans found.</p>
        ) : (
          <ul className="divide-y divide-glass-border">
            {items.map((plan) => (
              <li key={plan.id}>
                <label className="flex cursor-pointer items-start gap-3 p-3 transition hover:bg-glass-focus/40">
                  <Radio
                    className="mt-0.5"
                    name={`assign-plan-${athleteId}`}
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-surface-foreground">
                      {plan.title}
                    </span>
                    <span className="mt-1 block text-xs text-surface-muted">
                      {plan.weekCount} week{plan.weekCount === 1 ? "" : "s"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <InfiniteScrollSentinel
          hasMore={hasMore}
          loading={isLoadingMore}
          onLoadMore={loadMore}
        />
      </div>

      {shouldShowAthleteReassignWarning(currentPlanName) ? (
        <div className="shrink-0">
          <Message tone="info">
            {athleteName} is currently assigned to {currentPlanName}. Assigning a
            new plan will replace their current assignment with a fresh copy.
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
