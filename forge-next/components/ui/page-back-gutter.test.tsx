import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageBackGutter } from "@/components/ui/page-back-gutter";

describe("PageBackGutter", () => {
  it("positions the back link outside content without narrowing it", () => {
    render(
      <PageBackGutter back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
        <main data-testid="content">Plan detail</main>
      </PageBackGutter>,
    );

    const content = screen.getByTestId("content");
    const shell = content.parentElement;
    const backLink = screen.getByRole("link", { name: "Back to plans" });
    const backSlot = backLink.parentElement;

    expect(shell).toHaveClass("relative");
    expect(backSlot).toHaveClass("absolute", "right-full");
    expect(shell?.contains(backLink)).toBe(true);
    expect(content.contains(backLink)).toBe(false);
    expect(content.parentElement).toBe(shell);
  });
});
