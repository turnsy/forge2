import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Radio } from "@/components/ui/radio";

describe("Radio", () => {
  it("renders unchecked by default", () => {
    render(<Radio aria-label="Select plan" name="plan" value="plan-1" />);

    expect(screen.getByRole("radio")).not.toBeChecked();
  });

  it("calls onChange when selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Radio
        aria-label="Select plan"
        name="plan"
        value="plan-1"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio"));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
