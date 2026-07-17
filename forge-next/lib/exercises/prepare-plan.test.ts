import { describe, expect, it, vi } from "vitest";
import { makeExercise, makeSet, makeDay, makeBlock } from "@/lib/plans/__tests__/fixtures";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

vi.mock("./repository", () => ({
  findExactExercise: vi.fn(),
  createCoachExercise: vi.fn(),
}));

vi.mock("./search", () => ({
  searchExercises: vi.fn(),
  isAutoResolvable: vi.fn(),
}));

vi.mock("./llm-resolution", () => ({
  resolveAmbiguousExercises: vi.fn(),
}));

import { findExactExercise, createCoachExercise } from "./repository";
import { searchExercises, isAutoResolvable } from "./search";
import { resolveAmbiguousExercises } from "./llm-resolution";
import { preparePlanExerciseResolution } from "./prepare-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.1.0",
    name: "Plan",
    weeks: [
      {
        days: [
          makeDay({
            code: "w1d1",
            blocks: [
              makeBlock({
                id: "w1d1-b1",
                exercises: [
                  makeExercise({
                    name: "Back Squat",
                    sets: [makeSet({ id: "s1" })],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  };
}

describe("preparePlanExerciseResolution", () => {
  it("writes resolvedExerciseId from exact matches and creates unknown exercises", async () => {
    vi.mocked(findExactExercise).mockImplementation(async (raw) => {
      if (raw === "Back Squat") {
        return {
          id: "ex-1",
          name: "Back Squat",
          normalized_name: "back squat",
          owner_coach_id: null,
        };
      }
      return null;
    });
    vi.mocked(searchExercises).mockResolvedValue([]);
    vi.mocked(isAutoResolvable).mockReturnValue(false);
    vi.mocked(resolveAmbiguousExercises).mockResolvedValue(new Map());
    vi.mocked(createCoachExercise).mockResolvedValue({
      id: "ex-created",
      name: "Hatfield Squat",
      normalized_name: "hatfield squat",
      owner_coach_id: "coach-1",
    });

    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises.push(
      makeExercise({
        name: "Hatfield Squat",
        sets: [makeSet({ id: "s2" })],
      }),
    );

    const resolved = await preparePlanExerciseResolution(plan, "coach-1");

    expect(
      resolved.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId,
    ).toBe("ex-1");
    expect(
      resolved.weeks[0].days[0].blocks[0].exercises[1].resolvedExerciseId,
    ).toBe("ex-created");
  });
});
