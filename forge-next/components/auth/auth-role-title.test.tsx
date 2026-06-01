import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const onRoleChange = vi.fn();

import { AuthRoleTitle } from "@/components/auth/auth-role-title";

describe("AuthRoleTitle", () => {
  beforeEach(() => {
    onRoleChange.mockClear();
  });

  it("renders current role label", () => {
    render(<AuthRoleTitle role="coach" onRoleChange={onRoleChange} />);

    expect(
      screen.getByRole("button", { name: /Current role: Coach/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Register as/i)).toBeInTheDocument();
  });

  it("toggles menu open and exposes alternate role", async () => {
    const user = userEvent.setup();
    render(<AuthRoleTitle role="coach" onRoleChange={onRoleChange} />);

    const trigger = screen.getByRole("button", { name: /Current role: Coach/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("menuitem", { name: /Switch to Athlete/i }),
    ).toBeVisible();
  });

  it("calls onRoleChange when switching role", async () => {
    const user = userEvent.setup();
    render(<AuthRoleTitle role="coach" onRoleChange={onRoleChange} />);

    await user.click(screen.getByRole("button", { name: /Current role: Coach/i }));
    await user.click(screen.getByRole("menuitem", { name: /Switch to Athlete/i }));

    expect(onRoleChange).toHaveBeenCalledWith("athlete");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<AuthRoleTitle role="coach" onRoleChange={onRoleChange} />);

    const trigger = screen.getByRole("button", { name: /Current role: Coach/i });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on outside click", async () => {
    const user = userEvent.setup();
    render(
      <>
        <div data-testid="outside">outside</div>
        <AuthRoleTitle role="coach" onRoleChange={onRoleChange} />
      </>,
    );

    const trigger = screen.getByRole("button", { name: /Current role: Coach/i });
    await user.click(trigger);
    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
