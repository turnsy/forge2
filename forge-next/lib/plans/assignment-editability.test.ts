import { describe, expect, it } from "vitest";
import {
  countAssignmentEditability,
  detectLockedSetMutations,
} from "@/lib/plans/assignment-editability";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function buildPlan(
  sets: Array<{ id: string; status: "planned" | "completed" | "skipped" }>,
): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Test Plan",
    weeks: [
      {
        index: 1,
        days: sets.map((set, index) => ({
          index: index + 1,
          code: `w1d${index + 1}`,
          exercises: [
            {
              name: "Squat",
              sets: [
                {
                  id: set.id,
                  planned: {
                    type: "exact",
                    reps: 5,
                    load: { type: "absolute", value: 100, unit: "kg" },
                  },
                  actual: set.status === "completed" ? { reps: 5 } : null,
                  status: set.status,
                  locked: set.status !== "planned",
                },
              ],
            },
          ],
        })),
      },
    ],
  };
}

describe("countAssignmentEditability", () => {
  it("counts editable and locked days", () => {
    const plan = buildPlan([
      { id: "w1d1-sq-1", status: "completed" },
      { id: "w1d2-sq-1", status: "planned" },
      { id: "w1d3-sq-1", status: "skipped" },
    ]);

    expect(countAssignmentEditability(plan)).toEqual({
      editableDayCount: 1,
      lockedDayCount: 2,
    });
  });
});

describe("detectLockedSetMutations", () => {
  it("returns no errors when locked sets are unchanged", () => {
    const plan = buildPlan([
      { id: "w1d1-sq-1", status: "completed" },
      { id: "w1d2-sq-1", status: "planned" },
    ]);

    expect(detectLockedSetMutations(plan, structuredClone(plan))).toEqual([]);
  });

  it("detects locked set removal and field mutations", () => {
    const seed = buildPlan([
      { id: "w1d1-sq-1", status: "completed" },
      { id: "w1d2-sq-1", status: "planned" },
    ]);
    const output = structuredClone(seed);
    output.weeks[0].days = [output.weeks[0].days[1]];
    output.weeks[0].days[0].exercises[0].sets[0].planned = {
      type: "exact",
      reps: 8,
      load: { type: "absolute", value: 80, unit: "kg" },
    };
    output.weeks[0].days[0].exercises[0].sets[0].status = "completed";

    const errors = detectLockedSetMutations(seed, output);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "LOCKED_SET_REMOVED" }),
      ]),
    );
  });
});
