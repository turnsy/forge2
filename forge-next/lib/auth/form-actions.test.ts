import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignInWithEmail = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockSignInWithOAuth = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

vi.mock("@/lib/auth/actions", () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signUpWithEmail: (...args: unknown[]) => mockSignUpWithEmail(...args),
  signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
}));

import {
  loginFormAction,
  oauthFormAction,
  signupFormAction,
} from "@/lib/auth/form-actions";

describe("auth form actions", () => {
  beforeEach(() => {
    mockSignInWithEmail.mockReset();
    mockSignUpWithEmail.mockReset();
    mockSignInWithOAuth.mockReset();
    redirect.mockClear();
  });

  it("passes role-scoped login fields to signInWithEmail", async () => {
    mockSignInWithEmail.mockResolvedValue({ ok: true, redirectTo: "/coach" });

    const formData = new FormData();
    formData.set("email", " coach@example.com ");
    formData.set("password", "password123");
    formData.set("role", "coach");

    await expect(loginFormAction(null, formData)).rejects.toThrow(
      "REDIRECT:/coach",
    );

    expect(mockSignInWithEmail).toHaveBeenCalledWith({
      email: "coach@example.com",
      password: "password123",
      role: "coach",
    });
  });

  it("returns login errors without redirecting", async () => {
    mockSignInWithEmail.mockResolvedValue({
      ok: false,
      error: "Invalid login credentials",
    });

    const formData = new FormData();
    formData.set("email", "coach@example.com");
    formData.set("password", "wrong");
    formData.set("role", "coach");

    await expect(loginFormAction(null, formData)).resolves.toEqual({
      ok: false,
      error: "Invalid login credentials",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("passes role-scoped signup fields to signUpWithEmail", async () => {
    mockSignUpWithEmail.mockResolvedValue({ ok: true, redirectTo: "/athlete" });

    const formData = new FormData();
    formData.set("email", "athlete@example.com");
    formData.set("password", "password123");
    formData.set("fullName", "Athlete");
    formData.set("role", "athlete");

    await expect(signupFormAction(null, formData)).rejects.toThrow(
      "REDIRECT:/athlete",
    );

    expect(mockSignUpWithEmail).toHaveBeenCalledWith({
      email: "athlete@example.com",
      password: "password123",
      fullName: "Athlete",
      role: "athlete",
    });
  });

  it("redirects OAuth failures to the login hub", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      ok: false,
      error: "Sign in with Apple is not available yet.",
    });

    const formData = new FormData();
    formData.set("provider", "apple");
    formData.set("role", "coach");

    await expect(oauthFormAction(formData)).rejects.toThrow(
      "REDIRECT:/login?error=Sign%20in%20with%20Apple%20is%20not%20available%20yet.",
    );
  });
});
