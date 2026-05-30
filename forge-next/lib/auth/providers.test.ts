import { describe, expect, it } from "vitest";
import { isOAuthProviderEnabled } from "@/lib/auth/providers";

describe("OAuth provider availability", () => {
  it("enables Google", () => {
    expect(isOAuthProviderEnabled("google")).toBe(true);
  });

  it("disables Apple for now", () => {
    expect(isOAuthProviderEnabled("apple")).toBe(false);
  });
});
