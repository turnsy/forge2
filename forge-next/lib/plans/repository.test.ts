import { describe, expect, it } from "vitest";
import {
  mapCoachPlanDetailRow,
  mapCoachPlanRpcRow,
  mapCoachPlanRow,
} from "@/lib/plans/repository";

describe("mapCoachPlanRow", () => {
  it("maps a plan row with active version to a list item", () => {
    const item = mapCoachPlanRow({
      id: "plan-1",
      created_at: "2026-01-01T00:00:00.000Z",
      active_version: {
        plan_data: {
          schemaVersion: "2.0.0",
          name: "4-Week Strength Block",
          weeks: [
            {
              index: 1,
              days: [
                {
                  index: 1,
                  code: "w1d1",
                  exercises: [
                    {
                      name: "Back Squat",
                      sets: [
                        {
                          id: "w1d1-bs-1",
                          planned: {
                            type: "exact",
                            reps: 5,
                            load: { type: "absolute", value: 100, unit: "kg" },
                          },
                          actual: null,
                          status: "planned",
                          locked: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    expect(item).toEqual({
      id: "plan-1",
      title: "4-Week Strength Block",
      weekCount: 1,
      daysPerWeek: 1,
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
        min_days_per_week: 3,
        max_days_per_week: 4,
        created_at: "2026-01-01T00:00:00.000Z",
        total_count: 1,
      }),
    ).toEqual({
      id: "plan-1",
      title: "4-Week Strength Block",
      weekCount: 4,
      daysPerWeek: "3–4",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns null when title is empty", () => {
    expect(
      mapCoachPlanRpcRow({
        plan_id: "plan-1",
        title: "   ",
        week_count: 0,
        min_days_per_week: 0,
        max_days_per_week: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        total_count: 1,
      }),
    ).toBeNull();
  });
});

describe("mapCoachPlanDetailRow", () => {
  it("maps a valid plan row to detail", () => {
    const result = mapCoachPlanDetailRow({
      id: "plan-1",
      created_at: "2026-01-01T00:00:00.000Z",
      active_version: {
        plan_data: {
          schemaVersion: "2.0.0",
          name: "4-Week Strength Block",
          weeks: [
            {
              index: 1,
              days: [
                {
                  index: 1,
                  code: "w1d1",
                  exercises: [
                    {
                      name: "Back Squat",
                      sets: [
                        {
                          id: "w1d1-bs-1",
                          planned: {
                            type: "exact",
                            reps: 5,
                            load: { type: "absolute", value: 100, unit: "kg" },
                          },
                          actual: null,
                          status: "planned",
                          locked: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
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
        plan_data: { schemaVersion: "2.0.0" },
      },
    });

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
