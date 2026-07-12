import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

describe("PageShell", () => {
  it("renders back navigation in scroll chrome above page content", () => {
    render(
      <PageShell
        back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}
        header={<PageHeader title="Pending invites" />}
      >
        <p>Pending invites</p>
      </PageShell>,
    );

    const main = screen.getByRole("main");
    const backLink = screen.getByRole("link", { name: "Back to athletes" });

    expect(backLink).toHaveAttribute("href", "/coach/athletes");
    expect(main).toHaveTextContent("Pending invites");
    expect(main.contains(backLink)).toBe(true);
  });
});
