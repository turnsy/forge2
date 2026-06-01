import { describe, expect, it } from "vitest";
import {
  HOME_PATH,
  homePath,
  resolveInitialRole,
  signupRoleCookieOptions,
} from "@/lib/auth/routes";

describe("auth route helpers", () => {
  it("exposes home path", () => {
    expect(HOME_PATH).toBe("/");
  });

  it("resolves initial role from param", () => {
    expect(resolveInitialRole("coach")).toBe("coach");
    expect(resolveInitialRole("athlete")).toBe("athlete");
    expect(resolveInitialRole(undefined)).toBe("coach");
    expect(resolveInitialRole("admin")).toBe("coach");
  });

  it("builds home path with role", () => {
    expect(homePath("coach")).toBe("/?role=coach");
    expect(homePath("athlete")).toBe("/?role=athlete");
    expect(homePath()).toBe("/");
    expect(homePath(null)).toBe("/");
  });

  it("builds home path with message and error", () => {
    expect(homePath("coach", { message: "check-email" })).toBe(
      "/?role=coach&message=check-email",
    );
    expect(homePath("athlete", { error: "auth-code-error" })).toBe(
      "/?role=athlete&error=auth-code-error",
    );
  });

  it("exposes signup cookie options", () => {
    const options = signupRoleCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBeGreaterThan(0);
  });
});
