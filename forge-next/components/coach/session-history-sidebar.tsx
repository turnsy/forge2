"use client";

import { HistoryIcon } from "@/components/icons/history-icon";
import { SessionHistoryList } from "@/components/coach/session-history-list";

export function SessionHistorySidebar({
  collapsed,
  expanded,
  onExpand,
}: {
  collapsed: boolean;
  expanded: boolean;
  onExpand: () => void;
}) {
  if (collapsed) {
    return null;
  }

  return (
    <section
      className={[
        "flex min-h-0 flex-col gap-1 border-t border-surface-divider pt-3",
        expanded ? "" : "",
      ].join(" ")}
      aria-label="Conversation history"
    >
      <div className="flex items-center gap-2 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-surface-muted">
        <HistoryIcon className="h-3.5 w-3.5" />
        <span>History</span>
      </div>
      <SessionHistoryList className="px-1" onExpand={onExpand} />
    </section>
  );
}
