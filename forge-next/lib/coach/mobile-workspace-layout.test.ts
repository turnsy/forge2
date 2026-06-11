import { describe, expect, it } from "vitest";
import {
  MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS,
  MOBILE_BOTTOM_NAV_SCROLL_END_CLASS,
  MOBILE_OVERLAY_CLOSE_CLASS,
  MOBILE_OVERLAY_CONTENT_CLASS,
  MOBILE_WORKSPACE_X_PADDING_CLASS,
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

  it("defines composer inset and scroll-end padding", () => {
    expect(MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS).toContain("pb-[calc(4.5rem");
    expect(MOBILE_BOTTOM_NAV_SCROLL_END_CLASS).toContain("pb-[calc(4.5rem");
  });

  it("defines horizontal padding for the mobile chat surface", () => {
    expect(MOBILE_WORKSPACE_X_PADDING_CLASS).toContain("px-4");
    expect(MOBILE_WORKSPACE_X_PADDING_CLASS).toContain("md:px-0");
  });
});
