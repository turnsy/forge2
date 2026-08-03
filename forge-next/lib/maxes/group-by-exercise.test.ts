import { describe, expect, it } from "vitest";
import { filterMaxSummaries, groupMaxesByExercise } from "@/lib/maxes/group-by-exercise";

const entries = [
  {
    id: "1",
    exercise_id: "bench",
    exercise_name: "Bench Press",
    value: 225,
    unit: "lb",
    logged_at: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "2",
    exercise_id: "bench",
    exercise_name: "Bench Press",
    value: 215,
    unit: "lb",
    logged_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    exercise_id: "squat",
    exercise_name: "Back Squat",
    value: 315,
    unit: "lb",
    logged_at: "2026-01-15T00:00:00.000Z",
  },
];

describe("groupMaxesByExercise", () => {
  it("groups history and picks the latest max as current", () => {
    const summaries = groupMaxesByExercise(entries);

    expect(summaries).toHaveLength(2);
    expect(summaries[0].exerciseName).toBe("Back Squat");
    expect(summaries[1]).toMatchObject({
      exerciseId: "bench",
      currentValue: 225,
      history: [
        expect.objectContaining({ id: "1" }),
        expect.objectContaining({ id: "2" }),
      ],
    });
  });
});

describe("filterMaxSummaries", () => {
  it("filters summaries by exercise name", () => {
    const summaries = groupMaxesByExercise(entries);
    expect(filterMaxSummaries(summaries, "bench")).toHaveLength(1);
    expect(filterMaxSummaries(summaries, "bench")[0].exerciseName).toBe("Bench Press");
  });
});
