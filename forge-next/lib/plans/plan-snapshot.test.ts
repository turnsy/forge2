import { describe, expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import {
  createPlanSnapshot,
  hasUnsavedPlanChanges,
} from "@/lib/plans/plan-snapshot";

describe("plan snapshot", () => {
  it("detects title changes", () => {
    const saved = createPlanSnapshot(minimalWorkoutPlan, "Original");

    expect(
      hasUnsavedPlanChanges(
        { plan: minimalWorkoutPlan, title: "Updated" },
        saved,
      ),
    ).toBe(true);
  });

  it("returns false when unchanged", () => {
    const saved = createPlanSnapshot(minimalWorkoutPlan, minimalWorkoutPlan.name);

    expect(
      hasUnsavedPlanChanges(
        { plan: minimalWorkoutPlan, title: minimalWorkoutPlan.name },
        saved,
      ),
    ).toBe(false);
  });
});
