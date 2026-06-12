import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

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

import AthletePlanPage from "@/app/athlete/(app)/plan/page";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockGetActiveAthletePlan = vi.mocked(getActiveAthletePlan);

describe("AthletePlanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("redirects home when there is no active assignment", async () => {
    mockGetActiveAthletePlan.mockResolvedValue(null);

    await expect(AthletePlanPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/athlete");
  });

  it("redirects home when every day is already complete", async () => {
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

    await expect(AthletePlanPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/athlete");
  });
});
