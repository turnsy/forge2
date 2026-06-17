import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PillButton } from "@/components/ui/pill-button";

describe("PillButton", () => {
  it("uses glass secondary styling when unselected", () => {
    render(<PillButton>W1 D1</PillButton>);

    const button = screen.getByRole("button", { name: "W1 D1" });
    expect(button.className).toContain("bg-glass");
    expect(button.className).toContain("border-glass-border");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("uses primary glass styling when selected", () => {
    render(<PillButton selected>W1 D1</PillButton>);

    const button = screen.getByRole("button", { name: "W1 D1" });
    expect(button.className).toContain("glass-button-primary");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
