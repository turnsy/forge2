import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/ui/page-header";

describe("PageHeader", () => {
  it("renders the title and actions", () => {
    render(
      <PageHeader
        title="Pending invites"
        actions={<button type="button">Add</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Pending invites" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
