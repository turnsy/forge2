import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageBackGutter } from "@/components/ui/page-back-gutter";

describe("PageBackGutter", () => {
  it("positions the back link outside content on desktop without narrowing it", () => {
    render(
      <PageBackGutter back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
        <main data-testid="content">Plan detail</main>
      </PageBackGutter>,
    );

    const content = screen.getByTestId("content");
    const shell = content.parentElement?.parentElement?.parentElement;
    const desktopBackSlot = screen
      .getAllByRole("link", { name: "Back to plans" })
      .find((link) => !link.className.includes("md:hidden"))?.parentElement;

    expect(shell).toHaveClass("relative");
    expect(desktopBackSlot).toHaveClass("absolute", "right-full", "hidden", "md:flex");
    expect(
      content.contains(
        screen
          .getAllByRole("link", { name: "Back to plans" })
          .find((link) => !link.className.includes("md:hidden"))!,
      ),
    ).toBe(false);
  });

  it("keeps the back link in-flow beside content on mobile", () => {
    render(
      <PageBackGutter back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
        <main data-testid="content">Plan detail</main>
      </PageBackGutter>,
    );

    const mobileBackLink = screen
      .getAllByRole("link", { name: "Back to plans" })
      .find((link) => link.className.includes("md:hidden"));

    expect(mobileBackLink).toBeTruthy();
    expect(mobileBackLink?.parentElement).toHaveClass("flex", "min-w-0", "items-start");
    expect(mobileBackLink?.parentElement?.querySelector('[data-testid="content"]')).toBeTruthy();
  });
});
