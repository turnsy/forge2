"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AssignmentModalFooter } from "@/components/assignment-modal-footer";
import { AssignmentModalListPanel } from "@/components/list/assignment-modal-list-panel";
import { PlanPickerList } from "@/components/plan-picker-list";
import { Modal } from "@/components/ui/modal";
import { Input, Message } from "@/components/ui";
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

  const list = useInfiniteList<CoachPlanListItem>({
    apiPath: "/api/coach/plans",
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
          aria-label="Search plans"
          onChange={(event) => list.setSearch(event.target.value)}
        />
      </div>

      <AssignmentModalListPanel
        isListLoading={list.isListLoading}
        error={list.error}
        isEmpty={!list.isListLoading && !list.error && list.items.length === 0}
        emptyMessage="No plans found."
        hasMore={list.hasMore}
        isLoadingMore={list.isLoadingMore}
        onLoadMore={list.loadMore}
      >
        <PlanPickerList
          plans={list.items}
          athleteId={athleteId}
          selectedPlanId={selectedPlanId}
          onSelect={setSelectedPlanId}
        />
      </AssignmentModalListPanel>

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
