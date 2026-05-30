import { describe, expect, it } from "vitest";
import {
  loginHubPath,
  loginPathForRole,
  roleFromAuthRolePath,
  roleFromSignupPath,
  signupHubPath,
  signupPathForRole,
} from "@/lib/auth/routes";

describe("auth route helpers", () => {
  it("maps roles to signup paths", () => {
    expect(signupPathForRole("coach")).toBe("/coach/signup");
    expect(signupPathForRole("athlete")).toBe("/athlete/signup");
  });

  it("maps roles to login paths", () => {
    expect(loginPathForRole("coach")).toBe("/coach/login");
    expect(loginPathForRole("athlete")).toBe("/athlete/login");
  });

  it("exposes auth hub paths", () => {
    expect(loginHubPath()).toBe("/login");
    expect(signupHubPath()).toBe("/signup");
  });
});

describe("auth role path parsing", () => {
  it("derives role from signup paths", () => {
    expect(roleFromSignupPath("/coach/signup")).toBe("coach");
    expect(roleFromSignupPath("/athlete/signup")).toBe("athlete");
    expect(roleFromSignupPath("/login")).toBeNull();
  });

  it("derives role from login paths for OAuth cookie", () => {
    expect(roleFromAuthRolePath("/coach/login")).toBe("coach");
    expect(roleFromAuthRolePath("/athlete/login")).toBe("athlete");
  });
});
