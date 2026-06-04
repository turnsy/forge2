import { describe, expect, it } from "vitest";
import { summarizePlan } from "@/lib/plans/summarize-plan";

function minimalValidPlan() {
  return {
    schemaVersion: "2.0.0" as const,
    name: "Summer Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Back Squat",
                sets: [
                  {
                    id: "w1d1-bs-1",
                    planned: {
                      type: "exact" as const,
                      reps: 5,
                      load: { type: "absolute" as const, value: 100, unit: "kg" as const },
                    },
                    actual: null,
                    status: "planned" as const,
                    locked: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
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
