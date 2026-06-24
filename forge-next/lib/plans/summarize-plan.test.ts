import { describe, expect, it } from "vitest";
import {
  makeBlock,
  makeExercise,
  makeSet,
  makeWorkoutPlan,
} from "@/lib/plans/__tests__/fixtures";
import { summarizePlan } from "@/lib/plans/summarize-plan";

function minimalValidPlan() {
  return makeWorkoutPlan({ name: "Summer Block" });
}

function multiDayPlan() {
  return makeWorkoutPlan({ name: "Summer Block", multiDay: true });
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

  it("focuses on one week when week is provided", () => {
    const summary = summarizePlan(multiDayPlan(), { week: 0 });
    expect(summary).toContain("Week 0:");
    expect(summary).toContain("Back Squat");
    expect(summary).toContain("Bench Press");
    expect(summary).not.toContain("Weeks: 1");
  });

  it("returns set breakdown when week and day are provided", () => {
    const summary = summarizePlan(minimalValidPlan(), { week: 0, day: 0 });
    expect(summary).toContain("Day 0:");
    expect(summary).toContain("Back Squat:");
    expect(summary).toContain("8 @ 60 kg");
  });

  it("compresses identical sets", () => {
    const plan = makeWorkoutPlan({
      name: "Triple",
    });
    plan.weeks[0].days[0].blocks[0].exercises[0].sets = [
      makeSet({ id: "s1", planned: { type: "exact", reps: 5, target: { type: "absolute", value: 100, unit: "kg" } } }),
      makeSet({ id: "s2", planned: { type: "exact", reps: 5, target: { type: "absolute", value: 100, unit: "kg" } } }),
      makeSet({ id: "s3", planned: { type: "exact", reps: 5, target: { type: "absolute", value: 100, unit: "kg" } } }),
    ];

    const summary = summarizePlan(plan, { week: 0, day: 0 });
    expect(summary).toContain("3× 5 @ 100 kg");
  });

  it("lists varied sets individually", () => {
    const plan = makeWorkoutPlan({ name: "Varied" });
    plan.weeks[0].days[0].blocks[0].exercises[0].sets = [
      makeSet({ id: "s1", planned: { type: "exact", reps: 5, target: { type: "absolute", value: 100, unit: "kg" } } }),
      makeSet({ id: "s2", planned: { type: "exact", reps: 3, target: { type: "absolute", value: 110, unit: "kg" } } }),
    ];

    const summary = summarizePlan(plan, { week: 0, day: 0 });
    expect(summary).toContain("5 @ 100 kg, 3 @ 110 kg");
    expect(summary).not.toContain("2×");
  });

  it("labels superset blocks", () => {
    const plan = makeWorkoutPlan({ name: "Superset day" });
    plan.weeks[0].days[0].blocks.push(
      makeBlock({
        id: "w1d1-b2",
        exercises: [
          makeExercise({ name: "Bench press", id: "bp", sets: [makeSet({ id: "bp-1" })] }),
          makeExercise({ name: "Row", id: "row", sets: [makeSet({ id: "row-1" })] }),
        ],
      }),
    );

    const summary = summarizePlan(plan, { week: 0, day: 0 });
    expect(summary).toContain("Block 1 (superset)");
    expect(summary).toContain("Bench press:");
    expect(summary).toContain("Row:");
  });

  it("reports out-of-range week", () => {
    expect(summarizePlan(minimalValidPlan(), { week: 2 })).toContain("out of range");
  });

  it("reports out-of-range day", () => {
    expect(summarizePlan(minimalValidPlan(), { week: 0, day: 3 })).toContain("out of range");
  });

  it("requires week when day is provided", () => {
    expect(summarizePlan(minimalValidPlan(), { day: 0 })).toContain("day requires week");
  });
});
