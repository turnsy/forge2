import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(async () => ({
    id: "coach-1",
    email: "coach@example.com",
    role: "coach",
    fullName: "Coach Alex",
  })),
}));

vi.mock("@/lib/links/repository", () => ({
  getCoachAthleteRelationship: vi.fn(),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  getActiveAthletePlan: vi.fn(),
  listAthleteAssignedPlans: vi.fn(),
}));

import CoachAthleteDetailPage from "@/app/coach/(app)/athletes/[athleteId]/page";
import {
  getActiveAthletePlan,
  listAthleteAssignedPlans,
} from "@/lib/athlete/plan/repository";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const mockGetCoachAthleteRelationship = vi.mocked(getCoachAthleteRelationship);
const mockGetActiveAthletePlan = vi.mocked(getActiveAthletePlan);
const mockListAthleteAssignedPlans = vi.mocked(listAthleteAssignedPlans);

describe("CoachAthleteDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the tabbed athlete detail view for an active relationship", async () => {
    mockGetCoachAthleteRelationship.mockResolvedValue({
      relationshipId: "rel-1",
      status: "active",
      athleteId: "athlete-1",
      athleteName: "Alex Rivera",
      athleteEmail: "alex@example.com",
      linkedAt: "2026-01-10T00:00:00.000Z",
      currentPlanId: "plan-1",
      currentPlanName: "4-Week Strength Block",
    });
    mockGetActiveAthletePlan.mockResolvedValue({
      id: "assignment-1",
      athleteId: "athlete-1",
      coachId: "coach-1",
      status: "active",
      assignedAt: "2026-01-10T00:00:00.000Z",
      completedAt: null,
      unassignedAt: null,
      planVersionId: null,
      plan: minimalWorkoutPlan,
    });
    mockListAthleteAssignedPlans.mockResolvedValue([]);

    const ui = await CoachAthleteDetailPage({
      params: Promise.resolve({ athleteId: "athlete-1" }),
    });
    render(ui);

    expect(screen.getByRole("heading", { name: "Alex Rivera" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Current plan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Profile" })).toBeInTheDocument();
  });
});
