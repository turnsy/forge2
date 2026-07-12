import type { CSSProperties } from "react";
import type { OverlayScrollPadding } from "@/components/ui/overlay-scroll-chrome";

/** Full-bleed scroll lane; content uses padding to pass under overlay chrome. */
export const OVERLAY_SCROLL_LANE_CLASS =
  "absolute inset-0 z-0 overflow-x-hidden overflow-y-auto [overflow-anchor:none]";

export function hasOverlayScrollLane({
  scrollPaddingTop,
  scrollPaddingBottom,
}: OverlayScrollPadding): boolean {
  return (
    scrollPaddingTop !== undefined || scrollPaddingBottom !== undefined
  );
}

export function overlayScrollLaneStyle({
  scrollPaddingTop,
  scrollPaddingBottom,
}: OverlayScrollPadding): CSSProperties {
  return {
    ...(scrollPaddingTop !== undefined ? { paddingTop: scrollPaddingTop } : {}),
    ...(scrollPaddingBottom !== undefined
      ? { paddingBottom: scrollPaddingBottom }
      : {}),
  };
}
