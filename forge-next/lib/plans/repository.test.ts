import { describe, expect, it } from "vitest";
import { mapCoachPlanRow } from "@/lib/plans/repository";

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
