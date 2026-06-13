"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui";

export function AthleteSkipConfirmDialog({
  open,
  onConfirm,
  onCancel,
  pending = false,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <Modal
      open={open}
      title="Complete this day?"
      onClose={onCancel}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            fullWidth={false}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Completing…" : "Skip & Complete"}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Some sets still need input. These will be marked as skipped.
      </p>
    </Modal>
  );
}
