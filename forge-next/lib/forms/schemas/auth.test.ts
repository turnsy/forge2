import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/forms/schemas/auth";

describe("loginSchema", () => {
  it("accepts valid login values", () => {
    const result = loginSchema.safeParse({
      email: " coach@example.com ",
      password: "secret",
      role: "coach",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("coach@example.com");
      expect(result.data.password).toBe("secret");
    }
  });

  it("rejects whitespace-only email", () => {
    const result = loginSchema.safeParse({
      email: "   ",
      password: "secret",
      role: "coach",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
      role: "coach",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "coach@example.com",
      password: "",
      role: "coach",
    });

    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup values", () => {
    const result = signupSchema.safeParse({
      fullName: " Jane Doe ",
      email: "jane@example.com",
      password: "password",
      role: "athlete",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Jane Doe");
    }
  });

  it("rejects whitespace-only name", () => {
    const result = signupSchema.safeParse({
      fullName: "   ",
      email: "jane@example.com",
      password: "password",
      role: "athlete",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "short",
      role: "athlete",
    });

    expect(result.success).toBe(false);
  });
});
