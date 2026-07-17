import { describe, expect, it } from "vitest";
import { getPrescribedTargetLabel } from "@/components/plan/plan-athlete-parts";
import { makeSet } from "@/lib/plans/__tests__/fixtures";

describe("getPrescribedTargetLabel", () => {
  it("returns computed weight when a max exists", () => {
    const set = makeSet({
      id: "s1",
      planned: {
        type: "exact",
        reps: 5,
        target: { type: "percentage", value: 75, unit: "kg" },
      },
    });

    expect(getPrescribedTargetLabel(set, { value: 200, unit: "kg" })).toBe("150 kg");
  });

  it("converts max units before computing weight", () => {
    const set = makeSet({
      id: "s1",
      planned: {
        type: "exact",
        reps: 5,
        target: { type: "percentage", value: 75, unit: "kg" },
      },
    });

    expect(getPrescribedTargetLabel(set, { value: 200, unit: "lb" })).toBe("67.5 kg");
  });

  it("returns undefined when no max is available", () => {
    const set = makeSet({
      id: "s1",
      planned: {
        type: "exact",
        reps: 5,
        target: { type: "percentage", value: 75, unit: "kg" },
      },
    });

    expect(getPrescribedTargetLabel(set, null)).toBeUndefined();
  });
});
