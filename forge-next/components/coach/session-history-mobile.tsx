"use client";

import { useState } from "react";
import { HistoryIcon } from "@/components/icons/history-icon";
import { SessionHistoryList } from "@/components/coach/session-history-list";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

export function SessionHistoryMobile({
  activeSessionId,
  onActiveSessionDeleted,
}: {
  activeSessionId?: string;
  onActiveSessionDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth={false}
        icon={<HistoryIcon />}
        aria-label="Conversation history"
        onClick={() => setOpen(true)}
      >
        History
      </Button>

      <Modal
        open={open}
        title="Conversation history"
        onClose={() => setOpen(false)}
        size="large"
        bodyClassName="px-1"
      >
        <SessionHistoryList
          activeSessionId={activeSessionId}
          onActiveSessionDeleted={() => {
            onActiveSessionDeleted?.();
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
