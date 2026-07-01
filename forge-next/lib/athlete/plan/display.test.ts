import { describe, expect, it } from "vitest";
import { getAssignedPlanHistoryMeta } from "@/lib/athlete/plan/display";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";

function plan(overrides: Partial<AssignedPlan> = {}): AssignedPlan {
  return {
    id: "assignment-1",
    athleteId: "athlete-1",
    coachId: "coach-1",
    status: "completed",
    assignedAt: "2026-01-10T00:00:00.000Z",
    completedAt: "2026-02-01T12:00:00.000Z",
    unassignedAt: null,
    planVersionId: null,
    plan: minimalWorkoutPlan,
    ...overrides,
  };
}

describe("getAssignedPlanHistoryMeta", () => {
  it("shows completed date for completed plans", () => {
    expect(getAssignedPlanHistoryMeta(plan())).toEqual({
      label: "Completed",
      value: "Feb 1, 2026",
    });
  });

  it("shows aborted date for unassigned plans", () => {
    expect(
      getAssignedPlanHistoryMeta(
        plan({
          status: "unassigned",
          completedAt: null,
          unassignedAt: "2026-06-12T12:00:00.000Z",
        }),
      ),
    ).toEqual({
      label: "Aborted",
      value: "Jun 12, 2026",
    });
  });
});
