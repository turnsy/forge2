import { expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { percentageMaxRequirements } from "./plan-requirements";
it("checks only percentages, deduplicating their explicit basis exercise", () => {
  const plan = structuredClone(minimalWorkoutPlan);
  const exercise = plan.weeks[0].days[0].blocks[0].exercises[0];
  exercise.resolvedExerciseId = "close-grip";
  exercise.resolvedBasisExerciseId = "bench";
  exercise.basisRaw = "Bench Press";
  expect(percentageMaxRequirements(plan)).toEqual([]);
  exercise.sets[0].planned.target = { type: "percentage", value: 75, unit: "kg" };
  plan.weeks[0].days[0].blocks[0].exercises.push(structuredClone(exercise));
  expect(percentageMaxRequirements(plan)).toEqual([
    { exerciseId: "bench", exerciseName: "Bench Press" },
  ]);
  delete exercise.resolvedBasisExerciseId;
  delete exercise.basisRaw;
  expect(percentageMaxRequirements(plan)[0].exerciseId).toBe("close-grip");
});
it("reports unresolved percentage bases instead of guessing a max", () => {
  const plan = structuredClone(minimalWorkoutPlan);
  plan.weeks[0].days[0].blocks[0].exercises[0].sets[0].planned.target = {
    type: "percentage",
    value: 75,
    unit: "kg",
  };
  expect(() => percentageMaxRequirements(plan)).toThrow("Select a percentage basis");
});
