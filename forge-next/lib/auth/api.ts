import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import type { AuthUser, UserRole } from "@/lib/auth/types";

export type ApiAuthSuccess = { ok: true; user: AuthUser };

export type ApiAuthFailure = { ok: false; response: NextResponse };

export async function requireApiRole(
  role: UserRole,
): Promise<ApiAuthSuccess | ApiAuthFailure> {
  const user = await getAuthUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (user.role !== role) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
