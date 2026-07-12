"use client";

import { SessionHistoryList } from "@/components/coach/session-history-list";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import {
  hasOverlayScrollLane,
  OVERLAY_SCROLL_LANE_CLASS,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";
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
    <OverlayScrollChrome footerInsetClassName={MOBILE_BOTTOM_NAV_SCROLL_END_CLASS}>
      {({ scrollPaddingBottom }) => {
        const lanePadding = { scrollPaddingBottom };
        const lanePositioned = hasOverlayScrollLane(lanePadding);

        return (
        <div
          className={[
            lanePositioned ? OVERLAY_SCROLL_LANE_CLASS : "absolute inset-0 z-0 overflow-y-auto",
            "overscroll-y-contain",
            className,
          ].join(" ")}
          style={lanePositioned ? overlayScrollLaneStyle(lanePadding) : undefined}
        >
          <SessionHistoryList
            variant="mobile"
            onActiveSessionDeleted={onActiveSessionDeleted}
            onSessionOpen={() => onClose()}
            className="pb-4"
          />
        </div>
        );
      }}
    </OverlayScrollChrome>
  );
}
