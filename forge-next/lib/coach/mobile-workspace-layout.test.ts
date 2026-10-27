import { describe, expect, it } from "vitest";
import {
  MOBILE_COMPOSER_INSET_CLASS,
  MOBILE_SCROLL_END_CLASS,
  MOBILE_CHAT_SCROLL_END_GAP_PX,
  MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS,
  MOBILE_CHAT_COMPOSER_INPUT_SURFACE_CLASS,
  MOBILE_CHAT_FOOTER_CLASS,
  MOBILE_CHAT_CONTENT_INSET_X_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS,
  MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS,
  MOBILE_COMPOSER_TOOLBAR_ROW_CLASS,
  MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS,
  MOBILE_COMPOSER_TOOLBAR_OVERLAY_SPACING_CLASS,
  MOBILE_COMPOSER_VIEW_CONTROL_CLASS,
  MOBILE_VIEW_ARTIFACT_SPACING_CLASS,
} from "@/lib/coach/mobile-workspace-layout";

describe("mobile workspace layout classes", () => {
  it("defines composer inset and scroll-end padding", () => {
    expect(MOBILE_COMPOSER_INSET_CLASS).toContain("pb-[max(1rem");
    expect(MOBILE_SCROLL_END_CLASS).toContain("max-md:pb-[max(1rem");
  });

  it("defines horizontal padding for the mobile chat surface", () => {
    expect(MOBILE_CHAT_CONTENT_INSET_X_CLASS).toContain("max-md:px-4");
  });

  it("defines spacing between the view control and composer", () => {
    expect(MOBILE_VIEW_ARTIFACT_SPACING_CLASS).toBe("mb-4");
    expect(MOBILE_COMPOSER_TOOLBAR_OVERLAY_SPACING_CLASS).toBe("mb-2");
    expect(MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS).toContain("mb-2");
    expect(MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS).toContain("overflow-x-auto");
    expect(MOBILE_COMPOSER_TOOLBAR_ROW_CLASS).toContain("h-8");
    expect(MOBILE_COMPOSER_VIEW_CONTROL_CLASS).not.toContain("bg-gradient-to-l");
  });

  it("defines mobile overlay chat chrome for progressive blur", () => {
    expect(MOBILE_CHAT_COMPOSER_INPUT_SURFACE_CLASS).toContain("bg-surface/80");
    expect(MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS).toBe("relative");
    expect(MOBILE_CHAT_SCROLL_END_GAP_PX).toBe(24);
    expect(MOBILE_CHAT_FOOTER_CLASS).toContain("absolute");
    expect(MOBILE_CHAT_FOOTER_CLASS).toContain("pointer-events-none");
    expect(MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS).toContain("pt-4");
    expect(MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS).toContain("7.5rem");
    expect(MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS).toContain(
      "2rem",
    );
  });
});
