import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/form-actions", () => ({
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

import { SignupForm } from "@/components/auth/signup-form";

describe("SignupForm", () => {
  it("disables Continue until all fields meet requirements", async () => {
    const user = userEvent.setup();
    render(<SignupForm role="athlete" onSwitchToSignIn={vi.fn()} />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Full name"), "Jane Doe");
    await user.type(screen.getByPlaceholderText("Email"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "short");
    expect(continueButton).toBeDisabled();

    await user.clear(screen.getByPlaceholderText("Password"));
    await user.type(screen.getByPlaceholderText("Password"), "password");
    expect(continueButton).toBeEnabled();
  });

  it("calls onSwitchToSignIn when sign in is clicked", async () => {
    const user = userEvent.setup();
    const onSwitchToSignIn = vi.fn();
    render(<SignupForm role="coach" onSwitchToSignIn={onSwitchToSignIn} />);

    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(onSwitchToSignIn).toHaveBeenCalledOnce();
  });
});
