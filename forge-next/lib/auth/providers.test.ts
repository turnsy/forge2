import { describe, expect, it } from "vitest";
import {
  isOAuthProviderEnabled,
  oauthProviderUnavailableMessage,
} from "@/lib/auth/providers";

describe("OAuth provider availability", () => {
  it("enables Google for MVP", () => {
    expect(isOAuthProviderEnabled("google")).toBe(true);
  });

  it("blocks Apple until implemented", () => {
    expect(isOAuthProviderEnabled("apple")).toBe(false);
    expect(oauthProviderUnavailableMessage("apple")).toContain("Apple");
  });
});
