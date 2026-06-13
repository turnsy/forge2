import { beforeEach, describe, expect, it, vi } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import {
  getActiveAthletePlan,
  listAthleteAssignedPlans,
  mapAssignedPlanRow,
  savePlanActuals,
} from "@/lib/athlete/plan/repository";

function mockAssignedPlanQuery(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, maybeSingle: mockMaybeSingle });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockMaybeSingle.mockResolvedValue(result);
}

describe("athlete plan repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("maps assigned plan rows with validated workout plans", () => {
    const mapped = mapAssignedPlanRow({
      id: "assignment-1",
      athlete_id: "athlete-1",
      coach_id: "coach-1",
      plan_data: minimalWorkoutPlan,
      status: "active",
      assigned_at: "2026-01-01T00:00:00.000Z",
      completed_at: null,
      plan_version_id: "version-1",
    });

    expect(mapped).toEqual(
      expect.objectContaining({
        id: "assignment-1",
        athleteId: "athlete-1",
        plan: minimalWorkoutPlan,
      }),
    );
  });

  it("returns null for invalid plan data", () => {
    expect(
      mapAssignedPlanRow({
        id: "assignment-1",
        athlete_id: "athlete-1",
        coach_id: "coach-1",
        plan_data: { invalid: true },
        status: "active",
        assigned_at: "2026-01-01T00:00:00.000Z",
        completed_at: null,
        plan_version_id: null,
      }),
    ).toBeNull();
  });

  it("fetches the active assignment for an athlete", async () => {
    mockAssignedPlanQuery({
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

    const assignment = await getActiveAthletePlan("athlete-1");

    expect(assignment?.id).toBe("assignment-1");
    expect(mockFrom).toHaveBeenCalledWith("assigned_plans");
    expect(mockEq).toHaveBeenCalledWith("athlete_id", "athlete-1");
    expect(mockEq).toHaveBeenCalledWith("status", "active");
  });

  it("returns null when no active assignment exists", async () => {
    // RLS may also return null when a row exists but is not visible to the caller.
    mockAssignedPlanQuery({ data: null, error: null });

    await expect(getActiveAthletePlan("athlete-1")).resolves.toBeNull();
  });

  it("updates plan_data when saving actuals", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    });

    await savePlanActuals("assignment-1", minimalWorkoutPlan);

    expect(updateEq).toHaveBeenCalledWith("id", "assignment-1");
  });

  it("lists non-active assigned plans for an athlete and coach", async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, neq: mockNeq });
    mockNeq.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "assignment-2",
          athlete_id: "athlete-1",
          coach_id: "coach-1",
          plan_data: minimalWorkoutPlan,
          status: "completed",
          assigned_at: "2026-01-01T00:00:00.000Z",
          completed_at: "2026-02-01T00:00:00.000Z",
          plan_version_id: null,
        },
        {
          id: "assignment-3",
          athlete_id: "athlete-1",
          coach_id: "coach-1",
          plan_data: minimalWorkoutPlan,
          status: "unassigned",
          assigned_at: "2025-12-01T00:00:00.000Z",
          completed_at: null,
          plan_version_id: null,
        },
      ],
      error: null,
    });

    const plans = await listAthleteAssignedPlans("athlete-1", "coach-1");

    expect(plans).toHaveLength(2);
    expect(plans[0].status).toBe("completed");
    expect(plans[1].status).toBe("unassigned");
    expect(mockEq).toHaveBeenCalledWith("athlete_id", "athlete-1");
    expect(mockEq).toHaveBeenCalledWith("coach_id", "coach-1");
    expect(mockNeq).toHaveBeenCalledWith("status", "active");
  });
});
