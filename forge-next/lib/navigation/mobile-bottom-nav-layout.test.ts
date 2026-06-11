import { describe, expect, it } from "vitest";
import {
  MOBILE_BOTTOM_NAV_SELECTION_CLASS,
  MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX,
  MOBILE_BOTTOM_NAV_TRAY_CLASS,
  MOBILE_BOTTOM_NAV_TRAY_SURFACE_CLASS,
  MOBILE_BOTTOM_NAV_WIDTH_CLASS,
  shouldReserveMobileBottomNavSpace,
} from "@/lib/navigation/mobile-bottom-nav-layout";

describe("mobile bottom nav layout", () => {
  it("uses a three-quarter width glass tray with a wider rounded selection", () => {
    expect(MOBILE_BOTTOM_NAV_WIDTH_CLASS).toBe("w-3/4");
    expect(MOBILE_BOTTOM_NAV_TRAY_SURFACE_CLASS).toContain("backdrop-blur-md");
    expect(MOBILE_BOTTOM_NAV_TRAY_SURFACE_CLASS).toContain("bg-surface/70");
    expect(MOBILE_BOTTOM_NAV_TRAY_CLASS).toContain("overflow-visible");
    expect(MOBILE_BOTTOM_NAV_SELECTION_CLASS).toContain("rounded-full");
    expect(MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX).toBeGreaterThan(0);
  });
});

describe("shouldReserveMobileBottomNavSpace", () => {
  it("reserves space on the coach prompt page only", () => {
    expect(shouldReserveMobileBottomNavSpace("coach", "/coach")).toBe(true);
    expect(shouldReserveMobileBottomNavSpace("coach", "/coach/plans")).toBe(false);
    expect(shouldReserveMobileBottomNavSpace("athlete", "/athlete")).toBe(false);
  });
});
