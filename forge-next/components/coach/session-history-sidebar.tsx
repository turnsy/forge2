"use client";

import { HistoryIcon } from "@/components/icons/history-icon";
import { SessionHistoryList } from "@/components/coach/session-history-list";

export function SessionHistorySidebar({
  collapsed,
  onExpand,
}: {
  collapsed: boolean;
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <section
      className={[
        "mt-8 flex flex-col gap-1",
        collapsed ? "hidden" : "",
      ].join(" ")}
      aria-hidden={collapsed}
      aria-label="Conversation history"
    >
      <div className="flex items-center gap-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-surface-muted">
        <HistoryIcon className="h-4 w-4 shrink-0" />
        <span>History</span>
      </div>
      <SessionHistoryList onExpand={onExpand} />
    </section>
  );
}
