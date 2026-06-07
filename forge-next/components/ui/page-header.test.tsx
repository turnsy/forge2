import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/ui/page-header";

describe("PageHeader", () => {
  it("renders a back link to the left of the title", () => {
    render(
      <PageHeader
        title="Pending invites"
        back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Back to athletes" }),
    ).toHaveAttribute("href", "/coach/athletes");
    expect(
      screen.getByRole("heading", { level: 1, name: "Pending invites" }),
    ).toBeInTheDocument();
  });
});
