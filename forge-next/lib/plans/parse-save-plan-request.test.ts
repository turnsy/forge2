import { describe, expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { parseSavePlanRequest } from "@/lib/plans/parse-save-plan-request";

describe("parseSavePlanRequest", () => {
  it("parses a valid body", () => {
    const result = parseSavePlanRequest({
      plan: minimalWorkoutPlan,
      title: "My Plan",
    });

    expect(result).toEqual({
      ok: true,
      body: {
        plan: minimalWorkoutPlan,
        title: "My Plan",
        changeSummary: null,
      },
    });
  });

  it("rejects missing plan", () => {
    expect(parseSavePlanRequest({ title: "x" })).toEqual({
      ok: false,
      message: "plan is required",
    });
  });
});
