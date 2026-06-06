import { describe, expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { mergePlanTitle, preparePlanForSave } from "@/lib/plans/utils";

describe("mergePlanTitle", () => {
  it("overwrites plan name with trimmed title", () => {
    expect(mergePlanTitle(minimalWorkoutPlan, "  New Title  ")).toMatchObject({
      name: "New Title",
    });
  });

  it("keeps plan name when title is blank", () => {
    expect(mergePlanTitle(minimalWorkoutPlan, "   ")).toMatchObject({
      name: minimalWorkoutPlan.name,
    });
  });
});

describe("preparePlanForSave", () => {
  it("returns validated plan with merged title", () => {
    const result = preparePlanForSave(minimalWorkoutPlan, "Saved Plan");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.name).toBe("Saved Plan");
    }
  });

  it("returns validation errors for invalid plan", () => {
    const invalid = { ...minimalWorkoutPlan, weeks: [] };
    const result = preparePlanForSave(invalid, "Bad Plan");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
