import { describe, expect, it } from "vitest";
import { mapCoachAthleteRow } from "@/lib/athletes/repository";

describe("mapCoachAthleteRow", () => {
  it("maps an athlete row to a list item", () => {
    expect(
      mapCoachAthleteRow({
        athlete_id: "athlete-1",
        full_name: "Alex Rivera",
        email: "alex@example.com",
        linked_at: "2026-01-10T00:00:00.000Z",
        current_plan_id: "plan-1",
        current_plan_name: "4-Week Strength Block",
        current_assignment_status: "active",
        completion_percent: 32,
      }),
    ).toEqual({
      id: "athlete-1",
      name: "Alex Rivera",
      email: "alex@example.com",
      currentPlanId: "plan-1",
      currentPlanName: "4-Week Strength Block",
      completionPercent: 32,
      joinedAt: "2026-01-10T00:00:00.000Z",
    });
  });

  it("falls back when name or plan is missing", () => {
    expect(
      mapCoachAthleteRow({
        athlete_id: "athlete-2",
        full_name: null,
        email: null,
        linked_at: "2026-01-10T00:00:00.000Z",
        current_plan_id: null,
        current_plan_name: null,
        current_assignment_status: null,
        completion_percent: null,
      }),
    ).toEqual({
      id: "athlete-2",
      name: "Unnamed athlete",
      email: "",
      currentPlanId: null,
      currentPlanName: null,
      completionPercent: null,
      joinedAt: "2026-01-10T00:00:00.000Z",
    });
  });
});
