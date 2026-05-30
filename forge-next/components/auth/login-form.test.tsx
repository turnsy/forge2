import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/form-actions", () => ({
  loginFormAction: vi.fn(),
  oauthFormAction: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: () => [null, vi.fn()],
  };
});

import { LoginForm } from "@/components/auth/login-form";

describe("LoginForm", () => {
  it("disables Continue until email and password are filled", async () => {
    const user = userEvent.setup();
    render(<LoginForm role="coach" />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Email"), "coach@example.com");
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Password"), "secret");
    expect(continueButton).toBeEnabled();
  });

  it("shows banner when provided", () => {
    render(<LoginForm role="coach" banner="Welcome back" />);

    expect(screen.getByRole("status")).toHaveTextContent("Welcome back");
  });
});
