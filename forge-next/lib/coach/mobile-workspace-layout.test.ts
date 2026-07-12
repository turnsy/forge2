import { describe, expect, it } from "vitest";
import {
  MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS,
  MOBILE_BOTTOM_NAV_SCROLL_END_CLASS,
  MOBILE_CHAT_SCROLL_END_GAP_PX,
  MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS,
  MOBILE_CHAT_COMPOSER_INPUT_SURFACE_CLASS,
  MOBILE_CHAT_FOOTER_CLASS,
  MOBILE_CHAT_CONTENT_INSET_X_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS,
  MOBILE_CHAT_TOP_PROGRESSIVE_BLUR_CLASS,
  MOBILE_CHAT_TOP_OVERLAY_CLASS,
  MOBILE_CHAT_HEADER_CLASS,
  MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS,
  MOBILE_COMPOSER_TOOLBAR_ROW_CLASS,
  MOBILE_COMPOSER_VIEW_CONTROL_CLASS,
  MOBILE_OVERLAY_CLOSE_CLASS,
  MOBILE_OVERLAY_CONTENT_CLASS,
  MOBILE_VIEW_ARTIFACT_SPACING_CLASS,
  MOBILE_WORKSPACE_X_PADDING_CLASS,
} from "@/lib/coach/mobile-workspace-layout";

describe("mobile workspace layout classes", () => {
  it("positions the close control in the overlay corner", () => {
    expect(MOBILE_OVERLAY_CLOSE_CLASS).toContain("absolute");
    expect(MOBILE_OVERLAY_CLOSE_CLASS).toContain("right-4");
  });

  it("defines a header row for the chat reset control", () => {
    expect(MOBILE_CHAT_HEADER_CLASS).toContain("justify-end");
    expect(MOBILE_CHAT_HEADER_CLASS).toContain("shrink-0");
  });

  it("uses extra top padding on mobile for overlay content", () => {
    expect(MOBILE_OVERLAY_CONTENT_CLASS).toContain("max-md:pt-16");
    expect(MOBILE_OVERLAY_CONTENT_CLASS).not.toContain("md:pt-14");
  });

  it("defines composer inset and scroll-end padding", () => {
    expect(MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS).toContain("pb-[calc(4.5rem");
    expect(MOBILE_BOTTOM_NAV_SCROLL_END_CLASS).toContain("max-md:pb-[calc(4.5rem");
  });

  it("defines horizontal padding for the mobile chat surface", () => {
    expect(MOBILE_WORKSPACE_X_PADDING_CLASS).toContain("px-4");
    expect(MOBILE_WORKSPACE_X_PADDING_CLASS).toContain("md:px-0");
    expect(MOBILE_CHAT_CONTENT_INSET_X_CLASS).toContain("max-md:px-4");
  });

  it("defines spacing between the view control and composer", () => {
    expect(MOBILE_VIEW_ARTIFACT_SPACING_CLASS).toBe("mb-4");
    expect(MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS).toContain("overflow-x-auto");
    expect(MOBILE_COMPOSER_TOOLBAR_ROW_CLASS).toContain("h-8");
    expect(MOBILE_COMPOSER_VIEW_CONTROL_CLASS).not.toContain("bg-gradient-to-l");
  });

  it("defines mobile overlay chat chrome for progressive blur", () => {
    expect(MOBILE_CHAT_TOP_PROGRESSIVE_BLUR_CLASS).toContain("h-16");
    expect(MOBILE_CHAT_COMPOSER_INPUT_SURFACE_CLASS).toContain("bg-glass-nested");
    expect(MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS).toBe("relative");
    expect(MOBILE_CHAT_SCROLL_END_GAP_PX).toBe(8);
    expect(MOBILE_CHAT_FOOTER_CLASS).toContain("absolute");
    expect(MOBILE_CHAT_FOOTER_CLASS).toContain("pointer-events-none");
    expect(MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS).toContain("max-md:pt-16");
    expect(MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS).toContain("7.5rem");
    expect(MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS).toContain(
      "2rem",
    );
  });
});
