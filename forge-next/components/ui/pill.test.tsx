import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pill } from "@/components/ui/pill";

describe("Pill", () => {
  it("renders a link when href is provided", () => {
    render(
      <Pill href="/coach/athletes/pending" tone="danger">
        Pending (2)
      </Pill>,
    );

    const link = screen.getByRole("link", { name: "Pending (2)" });
    expect(link).toHaveAttribute("href", "/coach/athletes/pending");
    expect(link.className).toContain("bg-red-600");
  });

  it("renders a span when href is omitted", () => {
    render(<Pill tone="default">Draft</Pill>);

    expect(screen.getByText("Draft").tagName).toBe("SPAN");
  });
});
