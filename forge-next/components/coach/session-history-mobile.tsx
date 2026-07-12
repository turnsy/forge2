"use client";

import { HistoryIcon } from "@/components/icons/history-icon";
import { Button } from "@/components/ui";

export function SessionHistoryMobileToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant={open ? "primary" : "ghost"}
      size="sm"
      fullWidth={false}
      icon={<HistoryIcon />}
      aria-label="Conversation history"
      aria-pressed={open}
      className={`self-start${open ? "" : " text-surface-muted"}`}
      onClick={onToggle}
    >
      History
    </Button>
  );
}
