import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BackRefButton } from "@/components/ui/back-ref-button";

describe("BackRefButton", () => {
  it("renders a link with click handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event) => event.preventDefault());

    render(
      <BackRefButton href="/coach/plans/plan-1" onClick={onClick}>
        ← Back to plan
      </BackRefButton>,
    );

    const link = screen.getByRole("link", { name: "← Back to plan" });
    expect(link).toHaveAttribute("href", "/coach/plans/plan-1");

    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
