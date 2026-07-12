import { describe, expect, it } from "vitest";
import {
  hasOverlayScrollLane,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";

describe("overlay scroll lane helpers", () => {
  it("positions the scroll lane between chrome instead of using padding", () => {
    expect(overlayScrollLaneStyle({ scrollPaddingTop: 52, scrollPaddingBottom: 180 })).toEqual({
      top: 52,
      bottom: 180,
    });
  });

  it("defaults missing chrome offsets to zero", () => {
    expect(overlayScrollLaneStyle({ scrollPaddingBottom: 120 })).toEqual({
      top: 0,
      bottom: 120,
    });
  });

  it("detects when lane positioning should be used", () => {
    expect(hasOverlayScrollLane({})).toBe(false);
    expect(hasOverlayScrollLane({ scrollPaddingTop: 40 })).toBe(true);
  });
});
