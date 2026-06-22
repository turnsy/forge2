import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dropdown, DropdownItem } from "./dropdown";

describe("Dropdown", () => {
  it("styles destructive items with danger text", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown
        trigger={({ toggle, menuId, open }) => (
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={toggle}
          >
            Actions
          </button>
        )}
      >
        <DropdownItem onSelect={vi.fn()}>Open</DropdownItem>
        <DropdownItem destructive onSelect={vi.fn()}>
          Delete
        </DropdownItem>
      </Dropdown>,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByRole("menuitem", { name: "Open" })).toHaveClass(
      "text-surface-muted",
    );
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveClass(
      "!text-danger",
    );
    expect(
      screen.getByRole("menuitem", { name: "Delete" }).className,
    ).not.toContain("text-surface-muted");
  });
});
