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
      variant="ghost"
      size="sm"
      fullWidth={false}
      icon={<HistoryIcon />}
      aria-label="Conversation history"
      aria-pressed={open}
      className={
        open
          ? "border-white/30 bg-white/15 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2)]"
          : "text-surface-muted"
      }
      onClick={onToggle}
    >
      History
    </Button>
  );
}
