import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AccordionItem } from "@/components/ui/accordion";

describe("AccordionItem", () => {
  it("toggles panel visibility with smooth aria state", async () => {
    const user = userEvent.setup();

    render(
      <AccordionItem title={<span>Week 1</span>} defaultOpen>
        <p>Day content</p>
      </AccordionItem>,
    );

    const trigger = screen.getByRole("button", { name: /Week 1/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Day content")).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
