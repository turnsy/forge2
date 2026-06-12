import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageShell } from "@/components/ui/page-shell";

describe("PageShell", () => {
  it("renders back navigation outside the main content column", () => {
    render(
      <PageShell back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}>
        <p>Pending invites</p>
      </PageShell>,
    );

    const main = screen.getByRole("main");
    const desktopBackLink = screen
      .getAllByRole("link", { name: "Back to athletes" })
      .find((link) => link.parentElement?.className.includes("md:flex"));

    expect(desktopBackLink).toHaveAttribute("href", "/coach/athletes");
    expect(main).toHaveTextContent("Pending invites");
    expect(main.contains(desktopBackLink ?? null)).toBe(false);
    expect(
      screen.getAllByRole("link", { name: "Back to athletes" }),
    ).toHaveLength(2);
  });
});
