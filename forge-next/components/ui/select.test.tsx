import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "@/components/ui/select";

describe("Select", () => {
  it("applies shared control styling", () => {
    render(
      <Select aria-label="Week" defaultValue="1">
        <option value="1">Week 1</option>
      </Select>,
    );

    const select = screen.getByRole("combobox", { name: "Week" });
    expect(select.className).toContain("glass-surface");
    expect(select.className).toContain("rounded-control");
    expect(select.className).toContain("cursor-pointer");
  });

  it("renders a labeled select with an optional visually hidden label", () => {
    render(
      <Select label="Day" hideLabel defaultValue="1">
        <option value="1">Day 1</option>
      </Select>,
    );

    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByText("Day")).toHaveClass("sr-only");
  });

  it("supports wrapper layout classes", () => {
    const { container } = render(
      <Select label="Week" hideLabel wrapperClassName="min-w-0 flex-1" defaultValue="1">
        <option value="1">Week 1</option>
      </Select>,
    );

    expect(container.querySelector("label")).toHaveClass("min-w-0", "flex-1");
  });
});
