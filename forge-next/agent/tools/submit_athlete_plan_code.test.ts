import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeWorkoutPlan, minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockFetchCoachAthleteActiveAssignment = vi.fn();
const mockSavePlanActuals = vi.fn();
const mockRunPlanCodeInSandbox = vi.fn();
const mockReserveSubmitAthletePlanCodeAttempt = vi.fn();
const mockGetCoachId = vi.fn();

vi.mock("@/agent/lib/assigned-plans", () => ({
  fetchCoachAthleteActiveAssignment: (...args: unknown[]) =>
    mockFetchCoachAthleteActiveAssignment(...args),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  savePlanActuals: (...args: unknown[]) => mockSavePlanActuals(...args),
}));

vi.mock("@/agent/lib/run-plan-code", () => ({
  runPlanCodeInSandbox: (...args: unknown[]) => mockRunPlanCodeInSandbox(...args),
}));

vi.mock("@/agent/lib/submit-athlete-plan-code-attempts", () => ({
  reserveSubmitAthletePlanCodeAttempt: (...args: unknown[]) =>
    mockReserveSubmitAthletePlanCodeAttempt(...args),
}));

vi.mock("@/agent/lib/coach-context", () => ({
  getCoachId: (...args: unknown[]) => mockGetCoachId(...args),
}));

import submitAthletePlanCode from "@/agent/tools/submit_athlete_plan_code";

const athleteId = "00000000-0000-4000-8000-000000000001";
const assignmentId = "00000000-0000-4000-8000-000000000002";

function makeCtx() {
  return {
    session: {
      turn: { id: "turn-1" },
      auth: {
        current: {
          principalId: "coach-1",
          attributes: {},
        },
      },
    },
    getSandbox: vi.fn().mockResolvedValue({}),
  } as never;
}

describe("submit_athlete_plan_code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCoachId.mockReturnValue("coach-1");
    mockReserveSubmitAthletePlanCodeAttempt.mockReturnValue({
      allowed: true,
      attempt: 1,
    });
    mockFetchCoachAthleteActiveAssignment.mockResolvedValue({
      ok: true,
      athleteName: "Jane Smith",
      assignment: {
        id: assignmentId,
        athleteId,
        coachId: "coach-1",
        status: "active",
        assignedAt: "2026-01-01T00:00:00.000Z",
        completedAt: null,
        unassignedAt: null,
        planVersionId: null,
        plan: minimalWorkoutPlan,
      },
    });
    mockRunPlanCodeInSandbox.mockResolvedValue({
      ok: true,
      plan: minimalWorkoutPlan,
    });
    mockSavePlanActuals.mockResolvedValue({ ok: true });
  });

  it("persists a valid assigned-plan edit", async () => {
    const result = await submitAthletePlanCode.execute(
      { athleteId, python: "plan = Plan.load()\nplan.save()" },
      makeCtx(),
    );

    expect(result).toEqual({
      ok: true,
      plan: minimalWorkoutPlan,
      summary: "Updated Jane Smith's plan.",
    });
    expect(mockRunPlanCodeInSandbox).toHaveBeenCalledWith(
      expect.objectContaining({
        seed: minimalWorkoutPlan,
        python: "plan = Plan.load()\nplan.save()",
      }),
    );
    expect(mockSavePlanActuals).toHaveBeenCalledWith(
      assignmentId,
      minimalWorkoutPlan,
    );
  });

  it("returns not found when the athlete is not linked", async () => {
    mockFetchCoachAthleteActiveAssignment.mockResolvedValue({
      ok: false,
      notFound: {
        ok: false,
        code: "NOT_FOUND",
        message: "Athlete not found.",
      },
    });

    const result = await submitAthletePlanCode.execute(
      { athleteId, python: "plan.save()" },
      makeCtx(),
    );

    expect(result).toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: "Athlete not found.",
    });
    expect(mockSavePlanActuals).not.toHaveBeenCalled();
  });

  it("returns an error when the athlete has no active assignment", async () => {
    mockFetchCoachAthleteActiveAssignment.mockResolvedValue({
      ok: true,
      athleteName: "Jane Smith",
      assignment: null,
    });

    const result = await submitAthletePlanCode.execute(
      { athleteId, python: "plan.save()" },
      makeCtx(),
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          code: "NO_ACTIVE_ASSIGNMENT",
          message: "No active plan assignment for Jane Smith.",
        },
      ],
    });
  });

  it("surfaces sandbox failures without persisting", async () => {
    mockRunPlanCodeInSandbox.mockResolvedValue({
      ok: false,
      errors: [{ code: "SANDBOX_FAILED", message: "boom" }],
    });

    const result = await submitAthletePlanCode.execute(
      { athleteId, python: "raise Exception()" },
      makeCtx(),
    );

    expect(result).toEqual({
      ok: false,
      errors: [{ code: "SANDBOX_FAILED", message: "boom" }],
    });
    expect(mockSavePlanActuals).not.toHaveBeenCalled();
  });

  it("rejects edits that touch completed work", async () => {
    const completedPlan = makeWorkoutPlan({ dayComplete: true });
    const editedPlan = structuredClone(completedPlan);
    editedPlan.weeks[0].days[0].blocks[0].exercises[0].sets[0].planned = {
      type: "exact",
      reps: 6,
      target: { type: "absolute", value: 110, unit: "kg" },
    };

    mockFetchCoachAthleteActiveAssignment.mockResolvedValue({
      ok: true,
      athleteName: "Jane Smith",
      assignment: {
        id: assignmentId,
        athleteId,
        coachId: "coach-1",
        status: "active",
        assignedAt: "2026-01-01T00:00:00.000Z",
        completedAt: null,
        unassignedAt: null,
        planVersionId: null,
        plan: completedPlan,
      },
    });
    mockRunPlanCodeInSandbox.mockResolvedValue({
      ok: true,
      plan: editedPlan,
    });

    const result = await submitAthletePlanCode.execute(
      { athleteId, python: "plan.save()" },
      makeCtx(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok && "errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
    expect(mockSavePlanActuals).not.toHaveBeenCalled();
  });

  it("never returns full plan JSON to the model", () => {
    const output = submitAthletePlanCode.toModelOutput?.({
      ok: true,
      plan: minimalWorkoutPlan,
      summary: "Updated Jane Smith's plan.",
    });

    expect(output).toEqual({
      type: "text",
      value: "Updated Jane Smith's plan.",
    });
  });
});
