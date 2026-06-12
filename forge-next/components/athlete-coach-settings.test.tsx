import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUnlinkCoachAthleteAction = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/lib/links/actions", () => ({
  unlinkCoachAthleteAction: (...args: unknown[]) =>
    mockUnlinkCoachAthleteAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

import { AthleteCoachSettings } from "@/components/athlete-coach-settings";

describe("AthleteCoachSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnlinkCoachAthleteAction.mockResolvedValue({ ok: true });
  });

  it("renders coach details and unlinks on confirm", async () => {
    const user = userEvent.setup();

    render(
      <AthleteCoachSettings
        link={{
          relationshipId: "rel-1",
          status: "active",
          coachId: "coach-1",
          coachName: "Coach Alex",
          requestedAt: "2026-01-01T00:00:00.000Z",
          linkedAt: "2026-01-02T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Coach Alex")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unlink coach" }));

    expect(mockUnlinkCoachAthleteAction).toHaveBeenCalledWith("rel-1");
    expect(mockPush).toHaveBeenCalledWith("/athlete");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
