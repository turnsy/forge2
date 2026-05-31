import { describe, expect, it } from "vitest";
import { staggerDelayMs, STAGGER_STEP_MS } from "@/lib/motion/stagger";

describe("staggerDelayMs", () => {
  it("returns overlapping step delays", () => {
    expect(STAGGER_STEP_MS).toBe(70);
    expect(staggerDelayMs(0)).toBe(0);
    expect(staggerDelayMs(1)).toBe(70);
    expect(staggerDelayMs(2)).toBe(140);
  });
});
