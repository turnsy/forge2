import { describe, expect, it } from "vitest";
import { loginHubPath, loginPathForRole } from "@/lib/auth/login";

describe("login routes", () => {
  it("maps roles to login paths", () => {
    expect(loginPathForRole("coach")).toBe("/auth/login/coach");
    expect(loginPathForRole("athlete")).toBe("/auth/login/athlete");
    expect(loginHubPath()).toBe("/auth/login");
  });
});
