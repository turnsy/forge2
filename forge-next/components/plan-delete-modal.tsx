"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button, Message } from "@/components/ui";
import { deleteCoachPlanAction } from "@/lib/plans/actions";

type DeleteInfo = {
  planTitle: string;
  activeAssignmentCount: number;
};

export function PlanDeleteModal({
  planId,
  planTitle,
  onClose,
  onDeleted,
}: {
  planId: string;
  planTitle: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/coach/plans/${planId}/delete-info`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load plan details.");
        }

        return (await response.json()) as DeleteInfo;
      })
      .then((info) => {
        if (!cancelled) {
          setDeleteInfo(info);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load plan details.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInfo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [planId]);

  const displayTitle = deleteInfo?.planTitle ?? planTitle;
  const activeCount = deleteInfo?.activeAssignmentCount ?? 0;

  function handleDelete() {
    setActionError(null);

    startTransition(async () => {
      const result = await deleteCoachPlanAction(planId);

      if (!result.ok) {
        setActionError(result.error ?? "Could not delete plan.");
        return;
      }

      onClose();
      onDeleted?.();
      router.refresh();
    });
  }

  return (
    <Modal open title={`Delete “${displayTitle}”`} onClose={onClose}>
      {loadingInfo ? (
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading plan details…
        </p>
      ) : loadError ? (
        <Message tone="error">{loadError}</Message>
      ) : (
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          This will permanently delete the plan and its version history.
          {activeCount > 0
            ? ` ${activeCount} athlete${activeCount === 1 ? " is" : "s are"} currently assigned — they will be unassigned, but their workout history will be kept.`
            : " This action cannot be undone."}
        </p>
      )}

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
          variant="danger"
          size="sm"
          fullWidth={false}
          disabled={pending || loadingInfo || Boolean(loadError)}
          onClick={handleDelete}
        >
          {pending ? "Deleting…" : "Delete plan"}
        </Button>
      </div>
    </Modal>
  );
}
