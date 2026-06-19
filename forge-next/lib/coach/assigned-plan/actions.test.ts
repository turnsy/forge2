import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockRequireRoleAuth = vi.fn();
const mockGetAssignedPlanById = vi.fn();
const mockSavePlanActuals = vi.fn();

vi.mock("@/lib/errors/require-role-auth", () => ({
  requireRoleAuth: (...args: unknown[]) => mockRequireRoleAuth(...args),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  getAssignedPlanById: (...args: unknown[]) => mockGetAssignedPlanById(...args),
  savePlanActuals: (...args: unknown[]) => mockSavePlanActuals(...args),
}));

import { saveAssignedPlanAction } from "@/lib/coach/assigned-plan/actions";

describe("saveAssignedPlanAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRoleAuth.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach" },
    });
    mockGetAssignedPlanById.mockResolvedValue({
      ok: true,
      plan: {
        id: "assignment-1",
        athleteId: "athlete-1",
        coachId: "coach-1",
        status: "active",
        assignedAt: "2026-01-01T00:00:00.000Z",
        completedAt: null,
        unassignedAt: null,
        planVersionId: null,
        plan: minimalWorkoutPlan,
      },
    });
    mockSavePlanActuals.mockResolvedValue({ ok: true });
  });

  it("saves plan data for the authenticated coach", async () => {
    const result = await saveAssignedPlanAction("assignment-1", minimalWorkoutPlan);

    expect(result).toEqual({ ok: true });
    expect(mockSavePlanActuals).toHaveBeenCalledWith("assignment-1", minimalWorkoutPlan);
  });

  it("returns auth errors", async () => {
    mockRequireRoleAuth.mockResolvedValue({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });

    const result = await saveAssignedPlanAction("assignment-1", minimalWorkoutPlan);

    expect(result).toEqual({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });
    expect(mockSavePlanActuals).not.toHaveBeenCalled();
  });

  it("returns not found when assignment is missing or owned by another coach", async () => {
    mockGetAssignedPlanById.mockResolvedValue({ ok: true, plan: null });

    const result = await saveAssignedPlanAction("assignment-1", minimalWorkoutPlan);

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "Assignment not found or access denied",
    });
  });

  it("rejects edits to non-active assignments", async () => {
    mockGetAssignedPlanById.mockResolvedValue({
      ok: true,
      plan: {
        id: "assignment-1",
        athleteId: "athlete-1",
        coachId: "coach-1",
        status: "completed",
        assignedAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-02-01T00:00:00.000Z",
        unassignedAt: null,
        planVersionId: null,
        plan: minimalWorkoutPlan,
      },
    });

    const result = await saveAssignedPlanAction("assignment-1", minimalWorkoutPlan);

    expect(result).toEqual({
      ok: false,
      code: "validation_error",
      message: "Only active assignments can be edited",
    });
    expect(mockSavePlanActuals).not.toHaveBeenCalled();
  });
});
