import { describe, expect, it } from "vitest";
import {
  roleFromAuthRolePath,
  roleFromSignupPath,
} from "@/lib/auth/routes";

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
