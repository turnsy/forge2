import { describe, expect, it } from "vitest";
import {
  countSkippedDays,
  summarizeAssignedPlanProgress,
} from "@/lib/athlete/plan/summarize-assigned-plan-progress";
import type { AssignedPlan } from "@/lib/athlete/plan/assigned-plan-data";
import {
  makeBlock,
  makeDay,
  makeExercise,
  makeSet,
  makeWorkoutPlan,
} from "@/lib/plans/__tests__/fixtures";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makeAssignment(
  plan: WorkoutPlan,
  overrides: Partial<AssignedPlan> = {},
): AssignedPlan {
  return {
    id: "assignment-1",
    athleteId: "athlete-1",
    coachId: "coach-1",
    status: "active",
    assignedAt: "2026-01-15T12:00:00.000Z",
    completedAt: null,
    unassignedAt: null,
    planVersionId: "version-1",
    plan,
    ...overrides,
  };
}

function multiDayPlan(): WorkoutPlan {
  return makeWorkoutPlan({ name: "Summer Block", multiDay: true });
}

describe("summarizeAssignedPlanProgress", () => {
  it("summarizes overview with completion, current day, and skipped count", () => {
    const plan = multiDayPlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].sets = [
      makeSet({
        id: "set-1",
        status: "completed",
        actual: { reps: 8 },
      }),
      makeSet({ id: "set-2", status: "planned" }),
    ];
    plan.weeks[0].days[1].blocks[0].exercises[0].sets = [
      makeSet({ id: "skip-1", status: "skipped" }),
    ];

    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(plan),
    });

    expect(summary).toContain("Athlete: Jane Smith");
    expect(summary).toContain("Plan: Summer Block (active)");
    expect(summary).toContain("Completion:");
    expect(summary).toContain("Current: Week");
    expect(summary).toContain("Skipped days: 1");
    expect(summary).toContain("Assigned: Jan 15, 2026");
  });

  it("reports program complete when all days are done", () => {
    const plan = makeWorkoutPlan({ name: "Short Block" });
    for (const week of plan.weeks) {
      for (const day of week.days) {
        for (const block of day.blocks) {
          for (const exercise of block.exercises) {
            exercise.sets = exercise.sets.map((set) => ({
              ...set,
              status: "completed" as const,
              actual: { reps: 5 },
            }));
          }
        }
      }
    }

    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(plan),
    });

    expect(summary).toContain("Completion: 100%");
    expect(summary).toContain("Current: program complete");
  });

  it("summarizes one week with day status and exercises", () => {
    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(multiDayPlan()),
      week: 0,
    });

    expect(summary).toContain("Athlete: Jane Smith");
    expect(summary).toContain("Week 0:");
    expect(summary).toContain("Back Squat");
    expect(summary).toContain("Bench Press");
    expect(summary).toMatch(/Day 0 \(.*\): (upcoming|in progress|completed|skipped)/);
    expect(summary).not.toContain("Completion:");
  });

  it("summarizes one day with set status and logged actuals", () => {
    const plan = makeWorkoutPlan({ name: "Summer Block" });
    plan.weeks[0].days[0].blocks[0].exercises[0].sets[0] = makeSet({
      id: "set-1",
      status: "completed",
      actual: {
        reps: 8,
        target: { type: "absolute", value: 140, unit: "lb" },
      },
    });
    plan.weeks[0].days[0].blocks[0].exercises[0].sets.push(
      makeSet({ id: "set-2", status: "planned" }),
    );

    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(plan),
      week: 0,
      day: 0,
    });

    expect(summary).toContain("Day 0:");
    expect(summary).toContain("Back Squat:");
    expect(summary).toContain("Set 1:");
    expect(summary).toContain("completed");
    expect(summary).toContain("logged: 8 @ 140 lb");
    expect(summary).toContain("Set 2:");
    expect(summary).toContain("planned");
  });

  it("labels superset blocks on day detail", () => {
    const plan = makeWorkoutPlan({ name: "Superset day" });
    plan.weeks[0].days[0].blocks.push(
      makeBlock({
        id: "w1d1-b2",
        exercises: [
          makeExercise({
            name: "Bench press",
            id: "bp",
            sets: [makeSet({ id: "bp-1" })],
          }),
          makeExercise({
            name: "Row",
            id: "row",
            sets: [makeSet({ id: "row-1" })],
          }),
        ],
      }),
    );

    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(plan),
      week: 0,
      day: 0,
    });

    expect(summary).toContain("Block 1 (superset)");
    expect(summary).toContain("Bench press:");
    expect(summary).toContain("Row:");
  });

  it("reports out-of-range week", () => {
    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(makeWorkoutPlan()),
      week: 2,
    });

    expect(summary).toContain("out of range");
  });

  it("reports out-of-range day", () => {
    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(makeWorkoutPlan()),
      week: 0,
      day: 3,
    });

    expect(summary).toContain("out of range");
  });

  it("requires week when day is provided", () => {
    const summary = summarizeAssignedPlanProgress({
      athleteName: "Jane Smith",
      assignment: makeAssignment(makeWorkoutPlan()),
      day: 0,
    });

    expect(summary).toContain("day requires week");
  });
});

describe("countSkippedDays", () => {
  it("counts days where every set is skipped", () => {
    const plan = makeWorkoutPlan({ name: "Skipped day plan", multiDay: true });
    plan.weeks[0].days[1] = makeDay({
      code: "w1d2",
      blocks: [
        makeBlock({
          id: "w1d2-b1",
          exercises: [
            makeExercise({
              id: "rest",
              name: "Rest",
              sets: [makeSet({ id: "skip-1", status: "skipped" })],
            }),
          ],
        }),
      ],
    });

    expect(countSkippedDays(plan)).toBe(1);
  });
});
