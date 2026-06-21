"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button, Message } from "@/components/ui";
import { deleteTaskSession } from "@/lib/chat/actions";

export function SessionDeleteDialog({
  sessionId,
  title,
  onClose,
  onDeleted,
}: {
  sessionId: string;
  title: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteTaskSession(sessionId);

      if (!result.ok) {
        setError(result.message ?? "Could not delete conversation.");
        return;
      }

      onClose();
      onDeleted();
    });
  }

  return (
    <Modal
      open
      title={`Delete “${title}”?`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
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
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This will permanently delete this conversation. This action cannot be
        undone.
      </p>
      {error ? <Message tone="error">{error}</Message> : null}
    </Modal>
  );
}
