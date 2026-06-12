import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(async () => ({
    id: "athlete-1",
    email: "athlete@example.com",
    role: "athlete",
    fullName: "Athlete One",
  })),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  getActiveAthletePlan: vi.fn(),
}));

vi.mock("@/lib/links/repository", () => ({
  getAthleteCoachLink: vi.fn(async () => ({
    relationshipId: "rel-1",
    status: "active",
    coachId: "coach-1",
    coachName: "Coach Alex",
    requestedAt: "2026-01-01T00:00:00.000Z",
    linkedAt: "2026-01-02T00:00:00.000Z",
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import AthletePlanPage from "@/app/athlete/(app)/plan/page";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockGetActiveAthletePlan = vi.mocked(getActiveAthletePlan);

describe("AthletePlanPage", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders the current day entry view for an active assignment", async () => {
    mockGetActiveAthletePlan.mockResolvedValue({
      id: "assignment-1",
      athleteId: "athlete-1",
      coachId: "coach-1",
      status: "active",
      assignedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
      planVersionId: null,
      plan: minimalWorkoutPlan,
    });

    const ui = await AthletePlanPage();
    render(ui);

    expect(screen.getByRole("heading", { name: "4-Week Strength Block" })).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Day 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("5")).toBeInTheDocument();
  });

  it("renders celebration when all days are complete", async () => {
    const completedPlan = structuredClone(minimalWorkoutPlan);
    completedPlan.weeks[0].days[0].exercises[0].sets[0].status = "completed";

    mockGetActiveAthletePlan.mockResolvedValue({
      id: "assignment-1",
      athleteId: "athlete-1",
      coachId: "coach-1",
      status: "active",
      assignedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
      planVersionId: null,
      plan: completedPlan,
    });

    const ui = await AthletePlanPage();
    render(ui);

    expect(screen.getByText("All workouts complete! 🎉")).toBeInTheDocument();
  });

  it("renders no active plan message when assignment is missing", async () => {
    mockGetActiveAthletePlan.mockResolvedValue(null);

    const ui = await AthletePlanPage();
    render(ui);

    expect(screen.getByText("No active plan assigned yet.")).toBeInTheDocument();
  });
});
