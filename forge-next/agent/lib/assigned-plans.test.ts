import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCoachAthleteRelationship = vi.fn();
const mockQueryActiveAssignedPlan = vi.fn();

vi.mock("@/lib/links/repository", () => ({
  getCoachAthleteRelationship: (...args: unknown[]) =>
    mockGetCoachAthleteRelationship(...args),
}));

vi.mock("@/lib/athlete/plan/assigned-plan-data", () => ({
  queryActiveAssignedPlan: (...args: unknown[]) =>
    mockQueryActiveAssignedPlan(...args),
}));

import { fetchCoachAthleteActiveAssignment } from "@/agent/lib/assigned-plans";
import { makeWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

describe("fetchCoachAthleteActiveAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not found when the athlete is not actively linked", async () => {
    mockGetCoachAthleteRelationship.mockResolvedValue(null);

    const result = await fetchCoachAthleteActiveAssignment("coach-1", "athlete-1");

    expect(result).toEqual({
      ok: false,
      notFound: {
        ok: false,
        code: "NOT_FOUND",
        message: "Athlete not found.",
      },
    });
  });

  it("returns null assignment when the athlete has no active plan", async () => {
    mockGetCoachAthleteRelationship.mockResolvedValue({
      athleteName: "Jane Smith",
      status: "active",
    });
    mockQueryActiveAssignedPlan.mockResolvedValue({ ok: true, plan: null });

    const result = await fetchCoachAthleteActiveAssignment("coach-1", "athlete-1");

    expect(result).toEqual({
      ok: true,
      athleteName: "Jane Smith",
      assignment: null,
    });
  });

  it("returns the active assignment for a linked athlete", async () => {
    const plan = makeWorkoutPlan({ name: "Summer Block" });
    mockGetCoachAthleteRelationship.mockResolvedValue({
      athleteName: "Jane Smith",
      status: "active",
    });
    mockQueryActiveAssignedPlan.mockResolvedValue({
      ok: true,
      plan: {
        id: "assignment-1",
        athleteId: "athlete-1",
        coachId: "coach-1",
        status: "active",
        assignedAt: "2026-01-15T12:00:00.000Z",
        completedAt: null,
        unassignedAt: null,
        planVersionId: "version-1",
        plan,
      },
    });

    const result = await fetchCoachAthleteActiveAssignment("coach-1", "athlete-1");

    expect(result.ok).toBe(true);
    if (result.ok && result.assignment) {
      expect(result.athleteName).toBe("Jane Smith");
      expect(result.assignment.plan.name).toBe("Summer Block");
    }
  });

  it("rejects assignments owned by another coach", async () => {
    const plan = makeWorkoutPlan();
    mockGetCoachAthleteRelationship.mockResolvedValue({
      athleteName: "Jane Smith",
      status: "active",
    });
    mockQueryActiveAssignedPlan.mockResolvedValue({
      ok: true,
      plan: {
        id: "assignment-1",
        athleteId: "athlete-1",
        coachId: "other-coach",
        status: "active",
        assignedAt: "2026-01-15T12:00:00.000Z",
        completedAt: null,
        unassignedAt: null,
        planVersionId: null,
        plan,
      },
    });

    const result = await fetchCoachAthleteActiveAssignment("coach-1", "athlete-1");

    expect(result).toEqual({
      ok: false,
      notFound: {
        ok: false,
        code: "NOT_FOUND",
        message: "Athlete not found.",
      },
    });
  });
});
