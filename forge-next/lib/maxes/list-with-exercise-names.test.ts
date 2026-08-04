import { beforeEach, describe, expect, it, vi } from "vitest";

const mockListAthleteMaxes = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/maxes/mutations", () => ({
  listAthleteMaxes: (...args: unknown[]) => mockListAthleteMaxes(...args),
}));

vi.mock("@/utils/supabase/data-client", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import { listAthleteMaxesWithExerciseNames } from "@/lib/maxes/list-with-exercise-names";

describe("listAthleteMaxesWithExerciseNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when athlete has no maxes", async () => {
    mockListAthleteMaxes.mockResolvedValue([]);

    await expect(listAthleteMaxesWithExerciseNames("athlete-1")).resolves.toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("joins exercise names onto max rows", async () => {
    mockListAthleteMaxes.mockResolvedValue([
      {
        id: "max-1",
        athlete_id: "athlete-1",
        exercise_id: "ex-1",
        value: 225,
        unit: "lb",
        source: "tested",
        logged_at: "2026-01-01T00:00:00.000Z",
      },
    ]);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [{ id: "ex-1", name: "Bench Press" }],
          error: null,
        }),
      }),
    });

    await expect(listAthleteMaxesWithExerciseNames("athlete-1")).resolves.toEqual([
      expect.objectContaining({
        exercise_id: "ex-1",
        exercise_name: "Bench Press",
      }),
    ]);
  });
});
