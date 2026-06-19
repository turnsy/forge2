"use client";

import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

export function PlanEditorConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="danger" fullWidth={false} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-surface-muted">{description}</p>
    </Modal>
  );
}
