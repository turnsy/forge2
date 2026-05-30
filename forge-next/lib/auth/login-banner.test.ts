import { describe, expect, it } from "vitest";
import { resolveLoginBanner } from "@/lib/auth/login-banner";

describe("resolveLoginBanner", () => {
  it("maps known message keys to banner copy", () => {
    expect(resolveLoginBanner({ message: "check-email" })).toBe(
      "Check your email to confirm your account, then sign in.",
    );
    expect(resolveLoginBanner({ message: "reset-email-sent" })).toBe(
      "If that email exists, a reset link is on its way.",
    );
  });

  it("falls back to raw error text", () => {
    expect(resolveLoginBanner({ error: "Invalid credentials" })).toBe(
      "Invalid credentials",
    );
  });

  it("returns null when no banner applies", () => {
    expect(resolveLoginBanner({})).toBeNull();
    expect(resolveLoginBanner({ message: "unknown-key" })).toBeNull();
  });
});
