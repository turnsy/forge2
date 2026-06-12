import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  getAthleteCoachLink: vi.fn(async () => null),
}));

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

vi.mock("@/components/athlete-link-form", () => ({
  AthleteLinkForm: () => <div>Link form</div>,
}));

import AthletePage from "@/app/athlete/(app)/page";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockGetActiveAthletePlan = vi.mocked(getActiveAthletePlan);

describe("AthletePage", () => {
  it("shows plan link when an active assignment exists", async () => {
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

    const ui = await AthletePage();
    render(ui);

    expect(screen.getByRole("link", { name: "View My Plan →" })).toHaveAttribute(
      "href",
      "/athlete/plan",
    );
    expect(
      screen.queryByText("No plan assigned yet. Your coach will assign one here."),
    ).not.toBeInTheDocument();
  });

  it("shows no-plan state when there is no active assignment", async () => {
    mockGetActiveAthletePlan.mockResolvedValue(null);

    const ui = await AthletePage();
    render(ui);

    expect(
      screen.getByText("No plan assigned yet. Your coach will assign one here."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View My Plan →" })).not.toBeInTheDocument();
  });
});
