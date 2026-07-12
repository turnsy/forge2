import { describe, expect, it } from "vitest";
import {
  PAGE_CONTENT_INSET_BOTTOM_CLASS,
  PAGE_CONTENT_INSET_TOP_CLASS,
  PAGE_CONTENT_INSET_X_CLASS,
  PAGE_SCROLL_CONTENT_INSET_CLASS,
} from "@/lib/layout/page-layout";

describe("page layout classes", () => {
  it("defines content insets without outer shell padding", () => {
    expect(PAGE_CONTENT_INSET_X_CLASS).toContain("px-4");
    expect(PAGE_CONTENT_INSET_X_CLASS).toContain("md:px-8");
    expect(PAGE_CONTENT_INSET_TOP_CLASS).toContain("pt-4");
    expect(PAGE_CONTENT_INSET_BOTTOM_CLASS).toContain("pb-4");
    expect(PAGE_SCROLL_CONTENT_INSET_CLASS).toContain("px-4");
  });
});
