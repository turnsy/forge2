import { render, screen, within } from "@testing-library/react";
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
  it("renders the horizontal Forge logo and sign up form by default", () => {
    render(<AuthLandingPage initialRole="coach" />);

    expect(screen.getByRole("heading", { level: 1, name: "Forge" })).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1, name: "Forge" });
    const fullLogo = within(heading).getByRole("img", { name: "Forge" });
    expect(fullLogo).not.toHaveClass("hidden", "md:hidden");
    expect(fullLogo).toHaveAttribute("src", "/forge-logo.svg");
    expect(
      screen.getByRole("button", { name: /Current role: Coach/i }),
    ).toBeInTheDocument();
  });
});
