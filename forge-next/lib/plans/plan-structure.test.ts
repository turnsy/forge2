import { describe, expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { isDefaultDayContent } from "@/lib/plans/plan-defaults";
import {
  addDay,
  addWeek,
  canRemoveDay,
  canRemoveWeek,
  moveDay,
  moveWeek,
  removeDay,
  removeWeek,
  syncPlanStructure,
} from "@/lib/plans/plan-structure";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makeTwoWeekPlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Squat",
                sets: [
                  {
                    id: "w1d1-1",
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
          {
            index: 2,
            code: "w1d2",
            exercises: [
              {
                name: "Bench",
                sets: [
                  {
                    id: "w1d2-1",
                    planned: {
                      type: "exact",
                      reps: 5,
                      load: { type: "absolute", value: 80, unit: "kg" },
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
      {
        index: 2,
        label: "Week 2",
        days: [
          {
            index: 1,
            code: "w2d1",
            exercises: [
              {
                name: "Deadlift",
                sets: [
                  {
                    id: "w2d1-1",
                    planned: {
                      type: "exact",
                      reps: 3,
                      load: { type: "absolute", value: 140, unit: "kg" },
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
}

function expectValidPlan(plan: WorkoutPlan) {
  const result = loadWorkoutPlan(plan);
  expect(result.ok).toBe(true);
}

describe("plan-structure", () => {
  it("syncPlanStructure renumbers indices and day codes", () => {
    const plan = makeTwoWeekPlan();
    plan.weeks[0].days = [plan.weeks[0].days[1], plan.weeks[0].days[0]];

    const synced = syncPlanStructure(plan);

    expect(synced.weeks[0].days[0].index).toBe(1);
    expect(synced.weeks[0].days[0].code).toBe("w1d1");
    expect(synced.weeks[0].days[1].index).toBe(2);
    expect(synced.weeks[0].days[1].code).toBe("w1d2");
  });

  it("adds a week with a default day", () => {
    const nextPlan = addWeek(minimalWorkoutPlan);

    expect(nextPlan.weeks).toHaveLength(2);
    expect(nextPlan.weeks[1].index).toBe(2);
    expect(nextPlan.weeks[1].days).toHaveLength(1);
    expect(isDefaultDayContent(nextPlan.weeks[1].days[0])).toBe(true);
    expectValidPlan(nextPlan);
  });

  it("adds a day to the selected week", () => {
    const nextPlan = addDay(minimalWorkoutPlan, 1);

    expect(nextPlan.weeks[0].days).toHaveLength(2);
    expect(nextPlan.weeks[0].days[1].code).toBe("w1d2");
    expectValidPlan(nextPlan);
  });

  it("prevents removing the last week or last day", () => {
    expect(canRemoveWeek(minimalWorkoutPlan)).toBe(false);
    expect(canRemoveDay(minimalWorkoutPlan, 1)).toBe(false);
    expect(removeWeek(minimalWorkoutPlan, 1)).toBeNull();
    expect(removeDay(minimalWorkoutPlan, 1, 1)).toBeNull();
  });

  it("removes weeks and days when more than one exist", () => {
    const plan = makeTwoWeekPlan();

    const withoutDay = removeDay(plan, 1, 2);
    expect(withoutDay?.weeks[0].days).toHaveLength(1);
    expectValidPlan(withoutDay!);

    const withoutWeek = removeWeek(plan, 2);
    expect(withoutWeek?.weeks).toHaveLength(1);
    expectValidPlan(withoutWeek!);
  });

  it("reorders weeks and days", () => {
    const plan = makeTwoWeekPlan();

    const movedWeek = moveWeek(plan, 1, 1);
    expect(movedWeek?.weeks[0].index).toBe(1);
    expect(movedWeek?.weeks[0].days[0].exercises[0].name).toBe("Deadlift");
    expectValidPlan(movedWeek!);

    const movedDay = moveDay(plan, 1, 2, -1);
    expect(movedDay?.weeks[0].days[0].exercises[0].name).toBe("Bench");
    expect(movedDay?.weeks[0].days[0].code).toBe("w1d1");
    expectValidPlan(movedDay!);
  });
});
