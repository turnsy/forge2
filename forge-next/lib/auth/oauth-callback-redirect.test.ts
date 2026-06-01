import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getAuthCallbackRedirectUrl } from "@/lib/auth/oauth-callback-redirect";

describe("getAuthCallbackRedirectUrl", () => {
  it("redirects root OAuth codes to the auth callback route", () => {
    const request = new NextRequest(
      "http://localhost:3000/?code=44672c19-f1e6-45b2-ac79-efb6f695e4db",
    );

    expect(getAuthCallbackRedirectUrl(request)?.toString()).toBe(
      "http://localhost:3000/auth/callback?code=44672c19-f1e6-45b2-ac79-efb6f695e4db",
    );
  });

  it("preserves next when Supabase includes it", () => {
    const request = new NextRequest(
      "http://localhost:3000/?code=abc&next=%2Fcoach",
    );

    expect(getAuthCallbackRedirectUrl(request)?.toString()).toBe(
      "http://localhost:3000/auth/callback?code=abc&next=%2Fcoach",
    );
  });

  it("does not redirect when already on the callback route", () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc&next=%2Fcoach",
    );

    expect(getAuthCallbackRedirectUrl(request)).toBeNull();
  });
});
