import { describe, expect, it } from "vitest";
import {
  getAuthCallbackUrl,
  getOAuthRedirectTo,
  getPostAuthRedirect,
  getRoleMismatchRedirect,
  isUserRole,
  validateRedirectPath,
} from "@/lib/auth/redirects";

describe("isUserRole", () => {
  it("accepts coach and athlete", () => {
    expect(isUserRole("coach")).toBe(true);
    expect(isUserRole("athlete")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isUserRole("admin")).toBe(false);
    expect(isUserRole(null)).toBe(false);
  });
});

describe("validateRedirectPath", () => {
  it("allows same-origin relative paths", () => {
    expect(validateRedirectPath("/coach/plans")).toBe("/coach/plans");
  });

  it("blocks open redirects", () => {
    expect(validateRedirectPath("//evil.test")).toBe("/");
    expect(validateRedirectPath("https://evil.test")).toBe("/");
    expect(validateRedirectPath(null)).toBe("/");
  });
});

describe("getPostAuthRedirect", () => {
  it("routes by role", () => {
    expect(getPostAuthRedirect("coach")).toBe("/coach");
    expect(getPostAuthRedirect("athlete")).toBe("/athlete");
    expect(getPostAuthRedirect(null)).toBe("/signup");
  });
});

describe("getRoleMismatchRedirect", () => {
  it("sends users without a role to signup", () => {
    expect(getRoleMismatchRedirect("coach", null)).toBe("/signup");
  });

  it("sends users to the other role home", () => {
    expect(getRoleMismatchRedirect("coach", "athlete")).toBe("/athlete");
    expect(getRoleMismatchRedirect("athlete", "coach")).toBe("/coach");
  });
});

describe("auth callback URLs", () => {
  it("builds callback and oauth redirect URLs", () => {
    expect(getAuthCallbackUrl("http://localhost:3000", "/coach")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fcoach",
    );
    expect(getOAuthRedirectTo("http://localhost:3000", "/coach")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fcoach",
    );
  });
});
