import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CoachAthleteListItem } from "@/lib/athletes/types";
import { usePlanAthleteSelection } from "@/lib/plans/use-plan-athlete-selection";

function athlete(
  overrides: Partial<CoachAthleteListItem> = {},
): CoachAthleteListItem {
  return {
    id: "athlete-1",
    name: "Alex Rivera",
    email: "alex@example.com",
    currentPlanId: null,
    currentPlanName: null,
    completionPercent: null,
    joinedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("usePlanAthleteSelection", () => {
  it("preselects athletes already assigned to the plan", () => {
    const items = [
      athlete({ id: "athlete-1", currentPlanId: "plan-1", currentPlanName: "Block" }),
      athlete({ id: "athlete-2", currentPlanId: "plan-2", currentPlanName: "Other" }),
    ];

    const { result } = renderHook(() => usePlanAthleteSelection("plan-1", items));

    expect(result.current.selectedIds).toEqual(new Set(["athlete-1"]));
  });

  it("lets coaches manually select and deselect athletes", () => {
    const items = [athlete({ id: "athlete-1" }), athlete({ id: "athlete-2" })];

    const { result } = renderHook(() => usePlanAthleteSelection("plan-1", items));

    act(() => {
      result.current.toggleAthlete(items[0]);
    });

    expect(result.current.selectedIds).toEqual(new Set(["athlete-1"]));

    act(() => {
      result.current.toggleAthlete(items[0]);
    });

    expect(result.current.selectedIds).toEqual(new Set());
  });

  it("allows deselecting athletes already on the plan", () => {
    const items = [
      athlete({ id: "athlete-1", currentPlanId: "plan-1", currentPlanName: "Block" }),
    ];

    const { result } = renderHook(() => usePlanAthleteSelection("plan-1", items));

    expect(result.current.selectedIds).toEqual(new Set(["athlete-1"]));

    act(() => {
      result.current.toggleAthlete(items[0]);
    });

    expect(result.current.selectedIds).toEqual(new Set());
  });
});
