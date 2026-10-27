import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageBackGutter } from "@/components/ui/page-back-gutter";
import { PageHeader } from "@/components/ui/page-header";

describe("PageBackGutter", () => {
  it("positions the back link outside content on desktop without narrowing it", () => {
    render(
      <PageBackGutter back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
        <main data-testid="content">Plan detail</main>
      </PageBackGutter>,
    );

    const content = screen.getByTestId("content");
    const desktopBackSlot = screen
      .getAllByRole("link", { name: "Back to plans" })
      .find((link) => link.parentElement?.className.includes("md:flex"))?.parentElement;

    expect(content.parentElement).toHaveClass("relative");
    expect(desktopBackSlot).toHaveClass("absolute", "right-full", "z-30", "hidden", "md:flex");
    expect(content.contains(screen.getAllByRole("link", { name: "Back to plans" })[0])).toBe(
      false,
    );
  });

  it("removes mobile back slots and header indents without shifting body content", () => {
    render(
      <PageBackGutter back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
        <PageHeader title="1-Week Bench Press Plan" />
        <section data-testid="body">Plan body</section>
      </PageBackGutter>,
    );

    const mobileBackSlot = screen
      .getAllByRole("link", { name: "Back to plans" })
      .find((link) => link.parentElement?.className.includes("md:hidden"))?.parentElement;
    const shell = screen.getByRole("heading", { name: "1-Week Bench Press Plan" })
      .closest(".relative");
    const header = document.querySelector("[data-page-header]");
    const body = screen.getByTestId("body");

    expect(mobileBackSlot).toBeUndefined();
    expect(shell?.className).not.toContain("max-md:pl-12");
    expect(header).toBeTruthy();
    expect(body.className).not.toContain("pl-12");
    expect(body.parentElement?.className ?? "").not.toContain("flex");
  });

  it("can hide the mobile back link and header inset", () => {
    render(
      <PageBackGutter
        back={{ href: "/athlete", ariaLabel: "Back to home" }}
        >
        <PageHeader title="History" />
      </PageBackGutter>,
    );

    expect(
      screen.getAllByRole("link", { name: "Back to home" }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "History" }).closest(".relative")
        ?.className ?? "",
    ).not.toContain("[&_[data-page-header]]:max-md:pl-12");
  });
});
