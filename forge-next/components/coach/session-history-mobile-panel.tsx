"use client";

import { SessionHistoryList } from "@/components/coach/session-history-list";
import { MOBILE_BOTTOM_NAV_SCROLL_END_CLASS } from "@/lib/coach/mobile-workspace-layout";

export function SessionHistoryMobilePanel({
  onActiveSessionDeleted,
  onClose,
  className = "",
}: {
  onActiveSessionDeleted?: () => void;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
        MOBILE_BOTTOM_NAV_SCROLL_END_CLASS,
        className,
      ].join(" ")}
    >
      <SessionHistoryList
        variant="mobile"
        onActiveSessionDeleted={onActiveSessionDeleted}
        onSessionOpen={() => onClose()}
        className="pb-4"
      />
    </div>
  );
}
