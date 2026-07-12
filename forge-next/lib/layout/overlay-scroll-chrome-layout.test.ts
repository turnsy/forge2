import { describe, expect, it } from "vitest";
import {
  OVERLAY_BOTTOM_BLUR_ZONE_CLASS,
  OVERLAY_FOOTER_CLASS,
  OVERLAY_PRE_FOOTER_CLASS,
  OVERLAY_SCROLL_END_GAP_PX,
  OVERLAY_TOP_CHROME_CLASS,
  OVERLAY_TOP_CHROME_CONTENT_CLASS,
  OVERLAY_TOP_CHROME_HEADER_STACK_CLASS,
  OVERLAY_TOP_CONTAINER_CLASS,
} from "@/lib/layout/overlay-scroll-chrome-layout";

describe("overlay scroll chrome layout classes", () => {
  it("defines overlay chrome positioning and spacing", () => {
    expect(OVERLAY_TOP_CONTAINER_CLASS).toContain("absolute");
    expect(OVERLAY_TOP_CHROME_CLASS).toContain("pt-4");
    expect(OVERLAY_TOP_CHROME_CONTENT_CLASS).toContain("gap-6");
    expect(OVERLAY_TOP_CHROME_HEADER_STACK_CLASS).toContain("gap-6");
    expect(OVERLAY_FOOTER_CLASS).toContain("absolute");
    expect(OVERLAY_BOTTOM_BLUR_ZONE_CLASS).toBe("relative");
    expect(OVERLAY_PRE_FOOTER_CLASS).toContain("mb-2");
    expect(OVERLAY_SCROLL_END_GAP_PX).toBe(24);
  });
});
