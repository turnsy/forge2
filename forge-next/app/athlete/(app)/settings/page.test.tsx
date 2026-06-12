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

vi.mock("@/lib/links/repository", () => ({
  getAthleteCoachLink: vi.fn(),
}));

vi.mock("@/components/athlete-coach-settings", () => ({
  AthleteCoachSettings: () => <div>Coach settings</div>,
}));

import AthleteSettingsPage from "@/app/athlete/(app)/settings/page";
import { getAthleteCoachLink } from "@/lib/links/repository";

const mockGetAthleteCoachLink = vi.mocked(getAthleteCoachLink);

describe("AthleteSettingsPage", () => {
  it("shows coach settings when actively linked", async () => {
    mockGetAthleteCoachLink.mockResolvedValue({
      relationshipId: "rel-1",
      status: "active",
      coachId: "coach-1",
      coachName: "Coach Alex",
      requestedAt: "2026-01-01T00:00:00.000Z",
      linkedAt: "2026-01-02T00:00:00.000Z",
    });

    const ui = await AthleteSettingsPage();
    render(ui);

    expect(screen.getByText("Coach settings")).toBeInTheDocument();
  });

  it("shows link guidance when not actively linked", async () => {
    mockGetAthleteCoachLink.mockResolvedValue(null);

    const ui = await AthleteSettingsPage();
    render(ui);

    expect(
      screen.getByText(
        "Link to a coach from the home page to manage your coach connection here.",
      ),
    ).toBeInTheDocument();
  });
});
