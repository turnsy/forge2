import type { CSSProperties } from "react";
import type { OverlayScrollPadding } from "@/components/ui/overlay-scroll-chrome";

/** Positions a scroll lane between measured overlay chrome (keeps scrollbars out of blur). */
export const OVERLAY_SCROLL_LANE_CLASS = "absolute inset-x-0 z-0 overflow-y-auto";

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
    top: scrollPaddingTop ?? 0,
    bottom: scrollPaddingBottom ?? 0,
  };
}
