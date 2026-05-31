import { describe, expect, it } from "vitest";
import { mapCoachAthleteRow, mapCoachAthleteSummary } from "@/lib/athletes/repository";

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
      }),
    ).toEqual({
      id: "athlete-1",
      name: "Alex Rivera",
      email: "alex@example.com",
      currentPlanName: "4-Week Strength Block",
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
      }),
    ).toEqual({
      id: "athlete-2",
      name: "Unnamed athlete",
      email: "",
      currentPlanName: null,
      joinedAt: "2026-01-10T00:00:00.000Z",
    });
  });
});

describe("mapCoachAthleteSummary", () => {
  it("maps an athlete row to id and name only", () => {
    expect(
      mapCoachAthleteSummary({
        athlete_id: "athlete-1",
        full_name: "Alex Rivera",
        email: "alex@example.com",
        linked_at: "2026-01-10T00:00:00.000Z",
        current_plan_id: "plan-1",
        current_plan_name: "4-Week Strength Block",
        current_assignment_status: "active",
      }),
    ).toEqual({
      id: "athlete-1",
      name: "Alex Rivera",
    });
  });
});
