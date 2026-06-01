import type { NextRequest } from "next/server";

export function getAuthCallbackRedirectUrl(
  request: NextRequest,
): URL | null {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/auth/callback") {
    return null;
  }

  if (!searchParams.get("code")) {
    return null;
  }

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = "/auth/callback";

  return callbackUrl;
}
