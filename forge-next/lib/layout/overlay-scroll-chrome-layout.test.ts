import { describe, expect, it } from "vitest";
import {
  OVERLAY_BOTTOM_BLUR_ZONE_CLASS,
  OVERLAY_FOOTER_CLASS,
  OVERLAY_PRE_FOOTER_CLASS,
  OVERLAY_SCROLL_END_GAP_PX,
  OVERLAY_TOP_CHROME_CLASS,
  OVERLAY_TOP_CONTAINER_CLASS,
} from "@/lib/layout/overlay-scroll-chrome-layout";

describe("overlay scroll chrome layout classes", () => {
  it("defines overlay chrome positioning and spacing", () => {
    expect(OVERLAY_TOP_CONTAINER_CLASS).toContain("absolute");
    expect(OVERLAY_TOP_CHROME_CLASS).toContain("relative");
    expect(OVERLAY_FOOTER_CLASS).toContain("absolute");
    expect(OVERLAY_BOTTOM_BLUR_ZONE_CLASS).toBe("relative");
    expect(OVERLAY_PRE_FOOTER_CLASS).toContain("mb-2");
    expect(OVERLAY_SCROLL_END_GAP_PX).toBe(8);
  });
});
