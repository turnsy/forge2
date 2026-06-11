import { describe, expect, it } from "vitest";
import {
  MOBILE_OVERLAY_CLOSE_CLASS,
  MOBILE_OVERLAY_CONTENT_CLASS,
} from "@/lib/coach/mobile-workspace-layout";

describe("mobile workspace layout classes", () => {
  it("positions the close control in the overlay corner", () => {
    expect(MOBILE_OVERLAY_CLOSE_CLASS).toContain("absolute");
    expect(MOBILE_OVERLAY_CLOSE_CLASS).toContain("right-0");
  });

  it("uses extra top padding on mobile for overlay content", () => {
    expect(MOBILE_OVERLAY_CONTENT_CLASS).toContain("pt-16");
    expect(MOBILE_OVERLAY_CONTENT_CLASS).toContain("md:pt-14");
  });
});
