import { describe, expect, it } from "vitest";
import { canContinueLogin, canContinueSignup } from "@/lib/auth/form-validation";

describe("canContinueLogin", () => {
  it("requires non-whitespace email and non-empty password", () => {
    expect(canContinueLogin("coach@example.com", "secret")).toBe(true);
  });

  it("rejects whitespace-only email", () => {
    expect(canContinueLogin("   ", "secret")).toBe(false);
  });

  it("rejects empty password", () => {
    expect(canContinueLogin("coach@example.com", "")).toBe(false);
  });
});

describe("canContinueSignup", () => {
  it("requires trimmed name, email, and password of at least 8 characters", () => {
    expect(canContinueSignup("Jane Doe", "jane@example.com", "password")).toBe(
      true,
    );
  });

  it("rejects whitespace-only name", () => {
    expect(canContinueSignup("   ", "jane@example.com", "password")).toBe(
      false,
    );
  });

  it("rejects password shorter than 8 characters", () => {
    expect(canContinueSignup("Jane Doe", "jane@example.com", "short")).toBe(
      false,
    );
  });
});
