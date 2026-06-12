import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import { getAssignedPlanById } from "@/lib/athlete/plan/repository";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

describe("athlete plan RLS behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it("returns null when querying another athlete's assignment", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getAssignedPlanById("assignment-2")).resolves.toBeNull();
  });

  it("returns assignment data when the row is visible to the athlete", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "assignment-1",
        athlete_id: "athlete-1",
        coach_id: "coach-1",
        plan_data: minimalWorkoutPlan,
        status: "active",
        assigned_at: "2026-01-01T00:00:00.000Z",
        completed_at: null,
        plan_version_id: null,
      },
      error: null,
    });

    const assignment = await getAssignedPlanById("assignment-1");
    expect(assignment?.athleteId).toBe("athlete-1");
  });
});
