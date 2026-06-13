import { describe, expect, it } from "vitest";
import {
  getAthletesWithDifferentActivePlan,
  hasAthletesWithDifferentActivePlan,
  shouldShowAthleteReassignWarning,
} from "@/lib/plans/assignment";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

const athletes: CoachAthleteListItem[] = [
  {
    id: "athlete-1",
    name: "Alex",
    email: "alex@example.com",
    currentPlanId: "plan-a",
    currentPlanName: "Plan A",
    completionPercent: null,
    joinedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "athlete-2",
    name: "Sam",
    email: "sam@example.com",
    currentPlanId: "plan-b",
    currentPlanName: "Plan B",
    completionPercent: null,
    joinedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "athlete-3",
    name: "Jordan",
    email: "jordan@example.com",
    currentPlanId: null,
    currentPlanName: null,
    completionPercent: null,
    joinedAt: "2026-01-03T00:00:00.000Z",
  },
];

describe("shouldShowAthleteReassignWarning", () => {
  it("returns true when athlete has a current plan", () => {
    expect(shouldShowAthleteReassignWarning("Plan A")).toBe(true);
  });

  it("returns false when athlete has no current plan", () => {
    expect(shouldShowAthleteReassignWarning(null)).toBe(false);
    expect(shouldShowAthleteReassignWarning("   ")).toBe(false);
  });
});

describe("hasAthletesWithDifferentActivePlan", () => {
  it("detects selected athletes assigned to a different plan", () => {
    const selected = new Set(["athlete-1", "athlete-3"]);

    expect(
      hasAthletesWithDifferentActivePlan(athletes, selected, "plan-target"),
    ).toBe(true);
    expect(getAthletesWithDifferentActivePlan(athletes, selected, "plan-target"))
      .toHaveLength(1);
  });

  it("returns false when selected athletes are unassigned or already on target plan", () => {
    const selected = new Set(["athlete-1", "athlete-3"]);

    expect(hasAthletesWithDifferentActivePlan(athletes, selected, "plan-a")).toBe(
      false,
    );
  });
});
