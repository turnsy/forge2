import { describe, expect, it } from "vitest";
import {
  MOBILE_BOTTOM_NAV_TRAY_CLASS,
  MOBILE_BOTTOM_NAV_WIDTH_CLASS,
  shouldReserveMobileBottomNavSpace,
} from "@/lib/navigation/mobile-bottom-nav-layout";

describe("mobile bottom nav layout", () => {
  it("uses a three-quarter width cluster and glass tray", () => {
    expect(MOBILE_BOTTOM_NAV_WIDTH_CLASS).toBe("w-3/4");
    expect(MOBILE_BOTTOM_NAV_TRAY_CLASS).toContain("backdrop-blur-md");
    expect(MOBILE_BOTTOM_NAV_TRAY_CLASS).toContain("bg-surface/70");
  });
});

describe("shouldReserveMobileBottomNavSpace", () => {
  it("reserves space on the coach prompt page only", () => {
    expect(shouldReserveMobileBottomNavSpace("coach", "/coach")).toBe(true);
    expect(shouldReserveMobileBottomNavSpace("coach", "/coach/plans")).toBe(false);
    expect(shouldReserveMobileBottomNavSpace("athlete", "/athlete")).toBe(false);
  });
});
