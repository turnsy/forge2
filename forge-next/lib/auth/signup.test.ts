import { describe, expect, it } from "vitest";
import {
  roleFromAuthRolePath,
  roleFromSignupPath,
  signupPathForRole,
} from "@/lib/auth/routes";

describe("auth role routes", () => {
  it("maps roles to signup paths", () => {
    expect(signupPathForRole("coach")).toBe("/auth/signup/coach");
    expect(signupPathForRole("athlete")).toBe("/auth/signup/athlete");
  });

  it("derives role from signup path", () => {
    expect(roleFromSignupPath("/auth/signup/coach")).toBe("coach");
    expect(roleFromSignupPath("/auth/signup/athlete")).toBe("athlete");
    expect(roleFromSignupPath("/auth/login")).toBeNull();
  });

  it("derives role from login path for OAuth cookie", () => {
    expect(roleFromAuthRolePath("/auth/login/coach")).toBe("coach");
    expect(roleFromAuthRolePath("/auth/login/athlete")).toBe("athlete");
  });
});
