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
  it("shows sign in title without role switcher by default", () => {
    render(<AuthPanel initialRole="coach" />);

    expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Current role/i }),
    ).not.toBeInTheDocument();
  });

  it("switches to signup with role switcher", async () => {
    const user = userEvent.setup();
    render(<AuthPanel initialRole="athlete" />);

    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    expect(
      screen.getByRole("button", { name: /Current role: Athlete/i }),
    ).toBeInTheDocument();
  });

  it("seeds signup role from initialRole", async () => {
    const user = userEvent.setup();
    render(<AuthPanel initialRole="athlete" />);

    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    expect(
      screen.getByRole("button", { name: /Current role: Athlete/i }),
    ).toBeInTheDocument();
  });

  it("updates role via switcher callback", async () => {
    const user = userEvent.setup();
    render(<AuthPanel initialRole="coach" />);

    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    await user.click(screen.getByRole("button", { name: /Current role: Coach/i }));
    await user.click(screen.getByRole("menuitem", { name: /Switch to Athlete/i }));

    expect(setSignupRoleCookieAction).toHaveBeenCalledWith("athlete");
    expect(
      screen.getByRole("button", { name: /Current role: Athlete/i }),
    ).toBeInTheDocument();
  });
});
