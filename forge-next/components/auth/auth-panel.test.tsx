import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/form-actions", () => ({
  loginFormAction: vi.fn(),
  oauthFormAction: vi.fn(),
  setSignupRoleCookieAction: vi.fn(),
  signupFormAction: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: () => [null, vi.fn()],
  };
});

import { setSignupRoleCookieAction } from "@/lib/auth/form-actions";
import { AuthPanel } from "@/components/auth/auth-panel";

describe("AuthPanel", () => {
  it("shows sign up title with role switcher by default", () => {
    render(<AuthPanel initialRole="coach" />);

    expect(
      screen.getByRole("button", { name: /Current role: Coach/i }),
    ).toBeInTheDocument();
  });

  it("seeds signup role from initialRole", () => {
    render(<AuthPanel initialRole="athlete" />);

    expect(
      screen.getByRole("button", { name: /Current role: Athlete/i }),
    ).toBeInTheDocument();
  });

  it("switches to sign in without role switcher", async () => {
    const user = userEvent.setup();
    render(<AuthPanel initialRole="coach" />);

    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Current role/i }),
    ).not.toBeInTheDocument();
  });

  it("updates role via switcher callback", async () => {
    const user = userEvent.setup();
    render(<AuthPanel initialRole="coach" />);

    await user.click(screen.getByRole("button", { name: /Current role: Coach/i }));
    await user.click(screen.getByRole("menuitem", { name: /Switch to Athlete/i }));

    expect(setSignupRoleCookieAction).toHaveBeenCalledWith("athlete");
    expect(
      screen.getByRole("button", { name: /Current role: Athlete/i }),
    ).toBeInTheDocument();
  });

  it("does not animate on initial render", () => {
    const { container } = render(<AuthPanel initialRole="coach" />);

    expect(container.querySelector(".animate-auth-panel-forward")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-auth-panel-back")).not.toBeInTheDocument();
  });

  it("animates back when switching to sign in and forward when returning to signup", async () => {
    const user = userEvent.setup();
    const { container } = render(<AuthPanel initialRole="coach" />);

    await user.click(screen.getByRole("button", { name: /Sign in/i }));
    expect(container.querySelector(".animate-auth-panel-back")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    expect(container.querySelector(".animate-auth-panel-forward")).toBeInTheDocument();
  });
});
