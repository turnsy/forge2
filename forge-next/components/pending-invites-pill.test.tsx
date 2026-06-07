import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PendingInvitesPill } from "@/components/pending-invites-pill";

describe("PendingInvitesPill", () => {
  it("renders nothing when count is zero", () => {
    const { container } = render(<PendingInvitesPill count={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a pending link when count is positive", () => {
    render(<PendingInvitesPill count={3} />);

    const link = screen.getByRole("link", { name: "Pending (3)" });
    expect(link).toHaveAttribute("href", "/coach/athletes/pending");
  });
});
