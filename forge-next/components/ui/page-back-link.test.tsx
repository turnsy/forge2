import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PageBackButton, PageBackLink } from "@/components/ui/page-back-link";

describe("PageBackLink", () => {
  it("renders an icon-only link with an accessible label", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event) => event.preventDefault());

    render(
      <PageBackLink
        href="/coach/plans/plan-1"
        ariaLabel="Back to plan"
        onClick={onClick}
      />,
    );

    const link = screen.getByRole("link", { name: "Back to plan" });
    expect(link).toHaveAttribute("href", "/coach/plans/plan-1");
    expect(link).toHaveTextContent("");

    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("PageBackButton", () => {
  it("renders an icon-only button with an accessible label", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<PageBackButton ariaLabel="Back to history" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Back to history" });
    expect(button).toHaveTextContent("");

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
