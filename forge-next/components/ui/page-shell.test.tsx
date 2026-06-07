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

    const backLink = screen.getByRole("link", { name: "Back to athletes" });
    const main = screen.getByRole("main");

    expect(backLink).toHaveAttribute("href", "/coach/athletes");
    expect(main).toHaveTextContent("Pending invites");
    expect(main.contains(backLink)).toBe(false);
  });
});
