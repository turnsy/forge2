import { describe, expect, it } from "vitest";
import { shouldReserveMobileBottomNavSpace } from "@/lib/navigation/mobile-bottom-nav-layout";

describe("shouldReserveMobileBottomNavSpace", () => {
  it("reserves space on the coach prompt page only", () => {
    expect(shouldReserveMobileBottomNavSpace("coach", "/coach")).toBe(true);
    expect(shouldReserveMobileBottomNavSpace("coach", "/coach/plans")).toBe(false);
    expect(shouldReserveMobileBottomNavSpace("athlete", "/athlete")).toBe(false);
  });
});
