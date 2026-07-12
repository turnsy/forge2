import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageBackGutter } from "@/components/ui/page-back-gutter";
import { PageHeader } from "@/components/ui/page-header";

describe("PageBackGutter", () => {
  it("pins the back link above page content without narrowing the column", () => {
    render(
      <PageBackGutter back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}>
        <main data-testid="content">Plan detail</main>
      </PageBackGutter>,
    );

    const content = screen.getByTestId("content");
    const desktopBackSlot = screen
      .getAllByRole("link", { name: "Back to plans" })
      .find((link) => link.parentElement?.className.includes("md:flex"))?.parentElement;

    expect(content.parentElement).toHaveClass("relative", "z-0");
    expect(desktopBackSlot).toHaveClass("absolute", "left-0", "z-30", "hidden", "md:flex");
    expect(content.contains(screen.getAllByRole("link", { name: "Back to plans" })[0])).toBe(
      false,
    );
  });

  it("reserves header space for the mobile back link without shifting body content", () => {
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
      .closest("[data-page-back-gutter]");
    const header = document.querySelector("[data-page-header]");
    const body = screen.getByTestId("body");

    expect(mobileBackSlot).toHaveClass("absolute", "left-0", "top-0", "z-30", "md:hidden");
    expect(shell?.className).toContain("[&_[data-page-header]]:pl-12");
    expect(header).toBeTruthy();
    expect(body.className).not.toContain("pl-12");
    expect(body.parentElement?.className ?? "").not.toContain("flex");
  });

  it("can hide the mobile back link and header inset", () => {
    render(
      <PageBackGutter
        back={{ href: "/athlete", ariaLabel: "Back to home" }}
        showMobileBack={false}
      >
        <PageHeader title="History" />
      </PageBackGutter>,
    );

    expect(
      screen.getAllByRole("link", { name: "Back to home" }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "History" }).closest(
        "[data-page-back-gutter]",
      )?.className ?? "",
    ).toContain("[&_[data-page-header]]:md:pl-12");
    expect(
      screen.getByRole("heading", { name: "History" }).closest(
        "[data-page-back-gutter]",
      )?.className ?? "",
    ).not.toContain("[&_[data-page-header]]:pl-12");
  });
});
