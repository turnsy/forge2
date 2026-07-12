import { describe, expect, it } from "vitest";
import { artifactStructureKey } from "@/lib/coach/artifact-scroll";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(weekCount: number): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Plan",
    weeks: Array.from({ length: weekCount }, (_, weekIndex) => ({
      days: [
        {
          code: `W${weekIndex + 1}D1`,
          blocks: [
            {
              id: `block-${weekIndex}`,
              exercises: [
                {
                  id: `exercise-${weekIndex}`,
                  name: "Squat",
                  sets: [
                    {
                      id: `set-${weekIndex}`,
                      planned: { type: "exact", reps: 5, target: { type: "absolute", value: 135, unit: "lb" } },
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
    })) as WorkoutPlan["weeks"],
  };
}

describe("artifactStructureKey", () => {
  it("changes when plan structure changes but not when only the title changes", () => {
    const base = makePlan(1);
    const renamed: WorkoutPlan = { ...base, name: "Renamed plan" };
    const expanded = makePlan(2);

    expect(artifactStructureKey(base)).toBe(artifactStructureKey(renamed));
    expect(artifactStructureKey(base)).not.toBe(artifactStructureKey(expanded));
  });
});
