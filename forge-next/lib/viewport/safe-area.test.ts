import { describe, expect, it } from "vitest";
import {
  SAFE_AREA_PADDING_CLASS,
  SAFE_AREA_TOP_CLASS,
  SAFE_AREA_X_CLASS,
} from "@/lib/viewport/safe-area";

describe("safe area layout classes", () => {
  it("includes env() fallbacks for top inset", () => {
    expect(SAFE_AREA_TOP_CLASS).toContain("env(safe-area-inset-top,0px)");
  });

  it("uses only safe-area insets for horizontal shell padding", () => {
    expect(SAFE_AREA_X_CLASS).toContain("env(safe-area-inset-left,0px)");
    expect(SAFE_AREA_X_CLASS).toContain("env(safe-area-inset-right,0px)");
    expect(SAFE_AREA_X_CLASS).not.toContain("max(1rem");
  });

  it("includes padding on all sides for standalone screens", () => {
    expect(SAFE_AREA_PADDING_CLASS).toContain("env(safe-area-inset-top,0px)");
    expect(SAFE_AREA_PADDING_CLASS).toContain("env(safe-area-inset-bottom,0px)");
  });
});
