import { render, screen } from "@testing-library/react";
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

import { AuthLandingPage } from "@/components/auth/auth-landing-page";

describe("AuthLandingPage", () => {
  it("renders centered Forge title and sign in form", () => {
    render(<AuthLandingPage initialRole="coach" />);

    expect(screen.getByRole("heading", { level: 1, name: "Forge" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeInTheDocument();
  });
});
