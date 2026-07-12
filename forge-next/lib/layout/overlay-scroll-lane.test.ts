import { describe, expect, it } from "vitest";
import {
  hasOverlayScrollLane,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";

describe("overlay scroll lane helpers", () => {
  it("pads scroll content so it can pass under overlay chrome", () => {
    expect(overlayScrollLaneStyle({ scrollPaddingTop: 52, scrollPaddingBottom: 180 })).toEqual({
      paddingTop: 52,
      paddingBottom: 180,
    });
  });

  it("omits unset chrome offsets", () => {
    expect(overlayScrollLaneStyle({ scrollPaddingBottom: 120 })).toEqual({
      paddingBottom: 120,
    });
  });

  it("detects when lane padding should be used", () => {
    expect(hasOverlayScrollLane({})).toBe(false);
    expect(hasOverlayScrollLane({ scrollPaddingTop: 40 })).toBe(true);
  });
});
