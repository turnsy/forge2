import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlansPageHeader } from "@/components/plans-page-header";

describe("PlansPageHeader", () => {
  it("links New to a draft plan workspace", () => {
    render(<PlansPageHeader />);

    const newLink = screen.getByRole("link", { name: "New" });
    expect(newLink).toHaveAttribute("href", "/coach?new=1");
  });
});
