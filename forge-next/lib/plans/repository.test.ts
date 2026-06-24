import { describe, expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import {
  mapCoachPlanDetailRow,
  mapCoachPlanRpcRow,
  mapCoachPlanRow,
  mapCoachPlanVersionRow,
} from "@/lib/plans/repository";

describe("mapCoachPlanRow", () => {
  it("maps a plan row with active version to a list item", () => {
    const item = mapCoachPlanRow({
      id: "plan-1",
      created_at: "2026-01-01T00:00:00.000Z",
      active_version: {
        plan_data: minimalWorkoutPlan,
      },
    });

    expect(item).toEqual({
      id: "plan-1",
      title: "4-Week Strength Block",
      weekCount: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns null when active version is missing", () => {
    expect(
      mapCoachPlanRow({
        id: "plan-1",
        created_at: "2026-01-01T00:00:00.000Z",
        active_version: null,
      }),
    ).toBeNull();
  });
});

describe("mapCoachPlanRpcRow", () => {
  it("maps projected rpc columns to a list item", () => {
    expect(
      mapCoachPlanRpcRow({
        plan_id: "plan-1",
        title: "4-Week Strength Block",
        week_count: 4,
        created_at: "2026-01-01T00:00:00.000Z",
        total_count: 1,
      }),
    ).toEqual({
      id: "plan-1",
      title: "4-Week Strength Block",
      weekCount: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns null when title is empty", () => {
    expect(
      mapCoachPlanRpcRow({
        plan_id: "plan-1",
        title: "   ",
        week_count: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        total_count: 1,
      }),
    ).toBeNull();
  });
});

describe("mapCoachPlanVersionRow", () => {
  it("maps version rpc row", () => {
    expect(
      mapCoachPlanVersionRow({
        version_id: "version-1",
        change_summary: "Added week 2",
        created_at: "2026-01-01T00:00:00.000Z",
        created_by: "coach-1",
        is_active: true,
      }),
    ).toEqual({
      id: "version-1",
      changeSummary: "Added week 2",
      createdAt: "2026-01-01T00:00:00.000Z",
      createdBy: "coach-1",
      isActive: true,
    });
  });
});

describe("mapCoachPlanDetailRow", () => {
  it("maps a valid plan row to detail", () => {
    const result = mapCoachPlanDetailRow({
      id: "plan-1",
      created_at: "2026-01-01T00:00:00.000Z",
      active_version: {
        plan_data: minimalWorkoutPlan,
      },
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.detail).toEqual({
        id: "plan-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        plan: expect.objectContaining({ name: "4-Week Strength Block" }),
      });
    }
  });

  it("returns invalid when plan_data fails validation", () => {
    const result = mapCoachPlanDetailRow({
      id: "plan-1",
      created_at: "2026-01-01T00:00:00.000Z",
      active_version: {
        plan_data: { schemaVersion: "3.0.0" },
      },
    });

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
