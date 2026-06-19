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

const link = {
  relationshipId: "rel-1",
  status: "active" as const,
  coachId: "coach-1",
  coachName: "Coach Alex",
  requestedAt: "2026-01-01T00:00:00.000Z",
  linkedAt: "2026-01-02T00:00:00.000Z",
};

describe("AthleteCoachSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnlinkCoachAthleteAction.mockResolvedValue({ ok: true });
  });

  it("renders coach details and opens a confirmation modal before unlinking", async () => {
    const user = userEvent.setup();

    render(<AthleteCoachSettings link={link} />);

    expect(screen.getByText("Coach Alex")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unlink coach" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Unlink coach?")).toBeInTheDocument();
    expect(mockUnlinkCoachAthleteAction).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("button", { name: "Unlink coach" })[1]);

    expect(mockUnlinkCoachAthleteAction).toHaveBeenCalledWith("rel-1");
    expect(mockPush).toHaveBeenCalledWith("/athlete");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("closes the modal without unlinking when cancelled", async () => {
    const user = userEvent.setup();

    render(<AthleteCoachSettings link={link} />);

    await user.click(screen.getByRole("button", { name: "Unlink coach" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockUnlinkCoachAthleteAction).not.toHaveBeenCalled();
  });

  it("shows an error when unlinking fails", async () => {
    mockUnlinkCoachAthleteAction.mockResolvedValue({
      ok: false,
      error: "Unable to unlink coach",
    });
    const user = userEvent.setup();

    render(<AthleteCoachSettings link={link} />);

    await user.click(screen.getByRole("button", { name: "Unlink coach" }));
    await user.click(screen.getAllByRole("button", { name: "Unlink coach" })[1]);

    expect(screen.getByText("Unable to unlink coach")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
