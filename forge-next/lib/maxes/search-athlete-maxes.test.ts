import { describe, expect, it } from "vitest";
import { rankAthleteMaxSummaries } from "@/lib/maxes/search-athlete-maxes";
import type { ExerciseMaxSummary } from "@/lib/maxes/group-by-exercise";

const summaries: ExerciseMaxSummary[] = [
  {
    exerciseId: "bench",
    exerciseName: "Bench Press",
    currentValue: 225,
    currentUnit: "lb",
    currentMaxId: "max-1",
    loggedAt: "2026-02-01T00:00:00.000Z",
    history: [],
  },
  {
    exerciseId: "squat",
    exerciseName: "Back Squat",
    currentValue: 315,
    currentUnit: "lb",
    currentMaxId: "max-2",
    loggedAt: "2026-02-01T00:00:00.000Z",
    history: [],
  },
];

describe("rankAthleteMaxSummaries", () => {
  it("ranks exact and partial exercise name matches", () => {
    const results = rankAthleteMaxSummaries(summaries, "bench");

    expect(results).toHaveLength(1);
    expect(results[0].exerciseName).toBe("Bench Press");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("returns all summaries when query is empty", () => {
    expect(rankAthleteMaxSummaries(summaries, "", 1)).toHaveLength(1);
  });
});
