import { describe, expect, it } from "vitest";
import {
  loginHubPath,
  loginPathForRole,
  signupHubPath,
  signupPathForRole,
} from "@/lib/auth/routes";

describe("auth role routes", () => {
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
