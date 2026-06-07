"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AthletePickerList } from "@/components/athlete-picker-list";
import { AssignmentModalFooter } from "@/components/assignment-modal-footer";
import { AssignmentModalListPanel } from "@/components/list/assignment-modal-list-panel";
import { Modal } from "@/components/ui/modal";
import { Input, Message } from "@/components/ui";
import type { CoachAthleteListItem } from "@/lib/athletes/types";
import { useInfiniteList } from "@/lib/lists/use-infinite-list";
import { assignPlanToAthletesAction } from "@/lib/plans/actions";
import { hasAthletesWithDifferentActivePlan } from "@/lib/plans/assignment";
import { usePlanAthleteSelection } from "@/lib/plans/use-plan-athlete-selection";

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

  const list = useInfiniteList<CoachAthleteListItem>({
    apiPath: "/api/coach/athletes",
  });

  const { selectedIds, toggleAthlete } = usePlanAthleteSelection(
    planId,
    list.items,
  );

  const showReassignWarning = useMemo(
    () =>
      hasAthletesWithDifferentActivePlan(list.items, selectedIds, planId),
    [list.items, planId, selectedIds],
  );

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
          loading={list.loading}
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
          value={list.search}
          placeholder="Search"
          aria-label="Search athletes"
          onChange={(event) => list.setSearch(event.target.value)}
        />
      </div>

      <AssignmentModalListPanel
        isListLoading={list.isListLoading}
        error={list.error}
        isEmpty={!list.isListLoading && !list.error && list.items.length === 0}
        emptyMessage="No athletes found."
        hasMore={list.hasMore}
        isLoadingMore={list.isLoadingMore}
        onLoadMore={list.loadMore}
      >
        <AthletePickerList
          athletes={list.items}
          selectedIds={selectedIds}
          onToggle={toggleAthlete}
        />
      </AssignmentModalListPanel>

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
