import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InviteCodeModal } from "@/components/invite-code-modal";

describe("InviteCodeModal", () => {
  it("shows the invite code and confirms copy in the button label", async () => {
    const user = userEvent.setup();
    render(
      <InviteCodeModal inviteCode="ABCD1234" open onClose={vi.fn()} />,
    );

    expect(screen.getByText("ABCD1234")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy invite code" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });
  });

  it("shows an error when invite code is missing", () => {
    render(<InviteCodeModal inviteCode="" open onClose={vi.fn()} />);

    expect(
      screen.getByText(/Your invite code is not available yet/i),
    ).toBeInTheDocument();
  });
});
