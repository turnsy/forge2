import { describe, expect, it } from "vitest";
import { loadWorkoutPlan } from "@/lib/plans/validate";

function minimalValidPlan() {
  return {
    schemaVersion: "2.1.0",
    name: "Test Plan",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            blocks: [
              {
                type: "exercise",
                exercise: {
                  name: "Back Squat",
                  sets: [
                    {
                      id: "w1d1-bs-1",
                      planned: {
                        type: "exact",
                        reps: 5,
                        load: { type: "absolute", value: 100, unit: "kg" },
                      },
                      actual: null,
                      status: "planned",
                      locked: false,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("loadWorkoutPlan", () => {
  it("accepts a minimal valid plan", () => {
    const result = loadWorkoutPlan(minimalValidPlan());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.name).toBe("Test Plan");
    }
  });

  it("migrates legacy 2.0.0 exercises to blocks", () => {
    const legacy = {
      schemaVersion: "2.0.0",
      name: "Legacy Plan",
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
                        type: "exact",
                        reps: 5,
                        load: { type: "absolute", value: 100, unit: "kg" },
                      },
                      actual: null,
                      status: "planned",
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

    const result = loadWorkoutPlan(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.schemaVersion).toBe("2.1.0");
      expect(result.plan.weeks[0].days[0].blocks[0].type).toBe("exercise");
    }
  });

  it("rejects missing required fields", () => {
    const result = loadWorkoutPlan({ schemaVersion: "2.1.0" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.message.includes("required"))).toBe(
        true,
      );
    }
  });

  it("rejects wrong schemaVersion", () => {
    const result = loadWorkoutPlan({
      ...minimalValidPlan(),
      schemaVersion: "1.0.0",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.path.includes("schemaVersion"))).toBe(
        true,
      );
    }
  });

  it("rejects invalid day code pattern", () => {
    const plan = minimalValidPlan();
    plan.weeks[0].days[0].code = "invalid";

    const result = loadWorkoutPlan(plan);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.path.includes("code"))).toBe(true);
    }
  });
});
