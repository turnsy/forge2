"use client";

import { SessionHistoryList } from "@/components/coach/session-history-list";

export function SessionHistoryMobilePanel({
  activeSessionId,
  onActiveSessionDeleted,
  onClose,
  className = "",
}: {
  activeSessionId?: string;
  onActiveSessionDeleted?: () => void;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex min-h-0 flex-1 flex-col overflow-y-auto",
        className,
      ].join(" ")}
    >
      <SessionHistoryList
        variant="mobile"
        activeSessionId={activeSessionId}
        onActiveSessionDeleted={onActiveSessionDeleted}
        onSessionOpen={() => onClose()}
        className="px-1 pb-4"
      />
    </div>
  );
}
