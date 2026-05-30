import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockFrom = vi.fn();
const mockRequireSignupRoleCookie = vi.fn();
const mockConsumeSignupRoleCookie = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) =>
      name === "origin" ? "http://localhost:3000" : null,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/auth/signup-cookies", () => ({
  requireSignupRoleCookie: (...args: unknown[]) =>
    mockRequireSignupRoleCookie(...args),
  consumeSignupRoleCookie: (...args: unknown[]) =>
    mockConsumeSignupRoleCookie(...args),
}));

import {
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/auth/actions";

describe("auth actions", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignInWithPassword.mockReset();
    mockSignInWithOAuth.mockReset();
    mockFrom.mockReset();
    mockRequireSignupRoleCookie.mockReset();
    mockConsumeSignupRoleCookie.mockReset();
  });

  it("requires a signup role before email signup", async () => {
    mockRequireSignupRoleCookie.mockResolvedValue(null);

    const result = await signUpWithEmail({
      email: "coach@example.com",
      password: "password123",
      fullName: "Coach",
    });

    expect(result).toEqual({
      ok: false,
      error: "Start signup from /coach/signup or /athlete/signup.",
    });
  });

  it("redirects email signup to the role home when a session is created", async () => {
    mockRequireSignupRoleCookie.mockResolvedValue("coach");
    mockConsumeSignupRoleCookie.mockResolvedValue("coach");
    mockSignUp.mockResolvedValue({
      data: {
        session: {},
        user: { user_metadata: { role: "coach" } },
      },
      error: null,
    });

    const result = await signUpWithEmail({
      email: "coach@example.com",
      password: "password123",
      fullName: "Coach",
      role: "coach",
    });

    expect(result).toEqual({ ok: true, redirectTo: "/coach" });
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo:
            "http://localhost:3000/auth/callback?next=%2Fcoach",
        }),
      }),
    );
  });

  it("prefers the profile role over the login path role", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: { role: "athlete" } } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { role: "athlete" },
          }),
        }),
      }),
    });

    const result = await signInWithEmail({
      email: "coach@example.com",
      password: "password123",
      role: "coach",
    });

    expect(result).toEqual({ ok: true, redirectTo: "/athlete" });
  });

  it("falls back to the login path role when the profile has no role", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: {} } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: null } }),
        }),
      }),
    });

    const result = await signInWithEmail({
      email: "coach@example.com",
      password: "password123",
      role: "coach",
    });

    expect(result).toEqual({ ok: true, redirectTo: "/coach" });
  });

  it("blocks Apple OAuth while disabled", async () => {
    const result = await signInWithOAuth({ provider: "apple", role: "coach" });

    expect(result).toEqual({
      ok: false,
      error: "Sign in with Apple is not available yet.",
    });
    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it("starts Google OAuth with the role home callback", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });

    await expect(
      signInWithOAuth({ provider: "google", role: "athlete" }),
    ).rejects.toThrow("REDIRECT:https://accounts.google.com/o/oauth2/auth");

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Fathlete",
      },
    });
  });
});
