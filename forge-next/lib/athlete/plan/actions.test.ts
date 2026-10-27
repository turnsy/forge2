import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockRequireRoleAuth = vi.fn();
const mockGetAssignedPlanById = vi.fn();
const mockSavePlanActuals = vi.fn();
const mockCompleteDay = vi.fn();
const identity = { exerciseId: "exercise", setId: "set", catalogId: null };

vi.mock("@/lib/errors/require-role-auth", () => ({
  requireRoleAuth: (...args: unknown[]) => mockRequireRoleAuth(...args),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  getAssignedPlanById: (...args: unknown[]) => mockGetAssignedPlanById(...args),
  saveWorkoutSetActuals: (...args: unknown[]) => mockSavePlanActuals(...args),
  completeDay: (...args: unknown[]) => mockCompleteDay(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  completeDayAction,
  saveSetActualsAction,
} from "@/lib/athlete/plan/actions";
import { revalidatePath } from "next/cache";

describe("athlete plan actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRoleAuth.mockResolvedValue({
      ok: true,
      user: { id: "athlete-1", role: "athlete" },
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
    mockCompleteDay.mockResolvedValue({
      ok: true,
      allDaysDone: false,
      plan: minimalWorkoutPlan,
      setStatuses: [],
    });
  });

  it("saves set actuals for the authenticated athlete", async () => {
    const result = await saveSetActualsAction("assignment-1", 0, 0, 0, 0, {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    }, identity);

    expect(result).toEqual({ ok: true });
    expect(mockSavePlanActuals).toHaveBeenCalled();
  });

  it("returns auth errors from save action", async () => {
    mockRequireRoleAuth.mockResolvedValue({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });

    const result = await saveSetActualsAction("assignment-1", 0, 0, 0, 0, null, identity);

    expect(result).toEqual({
      ok: false,
      code: "unauthorized",
      message: "Not authenticated",
    });
    expect(mockSavePlanActuals).not.toHaveBeenCalled();
  });

  it("does not refresh or promote maxes when saving draft actuals", async () => {
    mockSavePlanActuals.mockResolvedValueOnce({ ok: true, maxChanged: false });
    await saveSetActualsAction("assignment-1", 0, 0, 0, 0, {
      reps: 1,
      target: { type: "absolute", value: 110, unit: "kg" },
    }, identity);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns not found when assignment is missing or owned by another athlete", async () => {
    mockGetAssignedPlanById.mockResolvedValue({ ok: true, plan: null });

    const result = await saveSetActualsAction("assignment-1", 0, 0, 0, 0, null, identity);

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "Assignment not found or access denied",
    });
  });

  it("returns repository errors from save action", async () => {
    mockSavePlanActuals.mockResolvedValue({
      ok: false,
      code: "db_error",
      message: "save failed",
    });

    const result = await saveSetActualsAction("assignment-1", 0, 0, 0, 0, null, identity);

    expect(result).toEqual({
      ok: false,
      code: "db_error",
      message: "save failed",
    });
  });

  it("completes a day and returns the next day position", async () => {
    const result = await completeDayAction("assignment-1", 0, 0);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allDaysDone).toBe(false);
      expect(result.nextDayPos).toBe(0);
      expect(result.plan).toEqual(minimalWorkoutPlan);
      expect(revalidatePath).toHaveBeenCalledWith("/athlete/maxes");
    }
  });

  it("returns repository errors from complete action", async () => {
    mockCompleteDay.mockResolvedValue({
      ok: false,
      code: "db_error",
      message: "complete failed",
    });

    const result = await completeDayAction("assignment-1", 0, 0);

    expect(result).toEqual({
      ok: false,
      code: "db_error",
      message: "complete failed",
    });
  });
});
