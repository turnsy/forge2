import { describe, expect, it } from "vitest";
import { roleFromSignupPath, signupPathForRole } from "@/lib/auth/signup";

describe("signup routes", () => {
  it("maps roles to signup paths", () => {
    expect(signupPathForRole("coach")).toBe("/auth/signup/coach");
    expect(signupPathForRole("athlete")).toBe("/auth/signup/athlete");
  });

  it("derives role from signup path", () => {
    expect(roleFromSignupPath("/auth/signup/coach")).toBe("coach");
    expect(roleFromSignupPath("/auth/signup/athlete")).toBe("athlete");
    expect(roleFromSignupPath("/auth/signup/coach/extra")).toBe("coach");
    expect(roleFromSignupPath("/auth/login")).toBeNull();
  });
});
