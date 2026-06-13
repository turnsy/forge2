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
  getAthleteCoachLink: vi.fn(),
}));

vi.mock("@/components/athlete-link-form", () => ({
  AthleteLinkForm: () => <div>Link form</div>,
}));

vi.mock("@/components/athlete-link-pending-view", () => ({
  AthleteLinkPendingView: () => <div>Pending link</div>,
}));

import AthletePage from "@/app/athlete/(app)/page";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockGetActiveAthletePlan = vi.mocked(getActiveAthletePlan);
const mockGetAthleteCoachLink = vi.mocked(getAthleteCoachLink);

describe("AthletePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows the link form when no coach link exists", async () => {
    mockGetAthleteCoachLink.mockResolvedValue(null);

    const ui = await AthletePage();
    render(ui);

    expect(screen.getByText("Link form")).toBeInTheDocument();
  });

  it("shows pending state while waiting for coach acceptance", async () => {
    mockGetAthleteCoachLink.mockResolvedValue({
      relationshipId: "rel-1",
      status: "pending",
      coachId: "coach-1",
      coachName: "Coach Alex",
      requestedAt: "2026-01-01T00:00:00.000Z",
      linkedAt: null,
    });

    const ui = await AthletePage();
    render(ui);

    expect(screen.getByText("Pending link")).toBeInTheDocument();
  });

  it("renders the current workout when linked with an active plan", async () => {
    mockGetAthleteCoachLink.mockResolvedValue({
      relationshipId: "rel-1",
      status: "active",
      coachId: "coach-1",
      coachName: "Coach Alex",
      requestedAt: "2026-01-01T00:00:00.000Z",
      linkedAt: "2026-01-02T00:00:00.000Z",
    });
    mockGetActiveAthletePlan.mockResolvedValue({
      id: "assignment-1",
      athleteId: "athlete-1",
      coachId: "coach-1",
      status: "active",
      assignedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
      unassignedAt: null,
      planVersionId: null,
      plan: minimalWorkoutPlan,
    });

    const ui = await AthletePage();
    render(ui);

    expect(screen.getByRole("heading", { name: "4-Week Strength Block" })).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Day 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("5")).toBeInTheDocument();
  });

  it("shows no-plan state when linked without an active assignment", async () => {
    mockGetAthleteCoachLink.mockResolvedValue({
      relationshipId: "rel-1",
      status: "active",
      coachId: "coach-1",
      coachName: "Coach Alex",
      requestedAt: "2026-01-01T00:00:00.000Z",
      linkedAt: "2026-01-02T00:00:00.000Z",
    });
    mockGetActiveAthletePlan.mockResolvedValue(null);

    const ui = await AthletePage();
    render(ui);

    expect(
      screen.getByText("No plan assigned yet. Your coach will assign one here."),
    ).toBeInTheDocument();
  });

  it("shows no-plan state when every day is already complete", async () => {
    const completedPlan = structuredClone(minimalWorkoutPlan);
    completedPlan.weeks[0].days[0].exercises[0].sets[0].status = "completed";

    mockGetAthleteCoachLink.mockResolvedValue({
      relationshipId: "rel-1",
      status: "active",
      coachId: "coach-1",
      coachName: "Coach Alex",
      requestedAt: "2026-01-01T00:00:00.000Z",
      linkedAt: "2026-01-02T00:00:00.000Z",
    });
    mockGetActiveAthletePlan.mockResolvedValue({
      id: "assignment-1",
      athleteId: "athlete-1",
      coachId: "coach-1",
      status: "active",
      assignedAt: "2026-01-01T00:00:00.000Z",
      completedAt: null,
      unassignedAt: null,
      planVersionId: null,
      plan: completedPlan,
    });

    const ui = await AthletePage();
    render(ui);

    expect(
      screen.getByText("No plan assigned yet. Your coach will assign one here."),
    ).toBeInTheDocument();
  });
});
