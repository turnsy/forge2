import { describe, expect, it } from "vitest";
import { makeWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { summarizePlan } from "@/lib/plans/summarize-plan";

function minimalValidPlan() {
  return makeWorkoutPlan({ name: "Summer Block" });
}

describe("summarizePlan", () => {
  it("describes an empty seed", () => {
    expect(summarizePlan(null)).toContain("No existing plan");
  });

  it("includes plan name, week count, and exercise names", () => {
    const summary = summarizePlan(minimalValidPlan());
    expect(summary).toContain("Summer Block");
    expect(summary).toContain("Weeks: 1");
    expect(summary).toContain("Back Squat");
  });
});
