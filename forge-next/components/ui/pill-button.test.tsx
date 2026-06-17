import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PillButton } from "@/components/ui/pill-button";

describe("PillButton", () => {
  it("uses glass secondary styling when unselected", () => {
    render(<PillButton>W1 D1</PillButton>);

    const button = screen.getByRole("button", { name: "W1 D1" });
    expect(button.className).toContain("bg-glass");
    expect(button.className).toContain("border-glass-border");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it("uses primary glass styling when selected", () => {
    render(<PillButton selected>W1 D1</PillButton>);

    const button = screen.getByRole("button", { name: "W1 D1" });
    expect(button.className).toContain("glass-button-primary");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it("allows callers to set toggle semantics via aria-pressed", () => {
    render(
      <PillButton selected aria-pressed>
        W1 D1
      </PillButton>,
    );

    expect(screen.getByRole("button", { name: "W1 D1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
