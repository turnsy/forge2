import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAcceptCoachLinkAction = vi.fn();
const mockRejectCoachLinkAction = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/lib/links/actions", () => ({
  acceptCoachLinkAction: (...args: unknown[]) => mockAcceptCoachLinkAction(...args),
  rejectCoachLinkAction: (...args: unknown[]) => mockRejectCoachLinkAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

import { PendingInviteList } from "@/components/pending-invite-list";

const invite = {
  relationshipId: "rel-1",
  athleteId: "athlete-1",
  athleteName: "Alex Rivera",
  athleteEmail: "alex@example.com",
  requestedAt: "2026-06-01T00:00:00.000Z",
};

describe("PendingInviteList", () => {
  beforeEach(() => {
    mockAcceptCoachLinkAction.mockReset();
    mockRejectCoachLinkAction.mockReset();
    mockRefresh.mockReset();
    mockAcceptCoachLinkAction.mockResolvedValue({ ok: true });
    mockRejectCoachLinkAction.mockResolvedValue({ ok: true });
  });

  it("renders an empty state when there are no invites", () => {
    render(<PendingInviteList invites={[]} />);

    expect(screen.getByText("No pending invites")).toBeInTheDocument();
  });

  it("accepts a pending invite", async () => {
    const user = userEvent.setup();
    render(<PendingInviteList invites={[invite]} />);

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(mockAcceptCoachLinkAction).toHaveBeenCalledWith("rel-1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("uses the danger variant for reject", async () => {
    const user = userEvent.setup();
    render(<PendingInviteList invites={[invite]} />);

    const rejectButton = screen.getByRole("button", { name: "Reject" });
    expect(rejectButton.className).toContain("text-danger");

    await user.click(rejectButton);

    expect(mockRejectCoachLinkAction).toHaveBeenCalledWith("rel-1");
  });
});
