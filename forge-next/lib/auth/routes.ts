import { isUserRole } from "@/lib/auth/redirects";
import type { UserRole } from "@/lib/auth/types";

const SIGNUP_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export const HOME_PATH = "/";

export function resolveInitialRole(param: string | undefined): UserRole {
  return isUserRole(param) ? param : "coach";
}

export function homePath(
  role?: UserRole | null,
  extra?: { message?: string; error?: string },
): string {
  const params = new URLSearchParams();

  if (role) {
    params.set("role", role);
  }

  if (extra?.message) {
    params.set("message", extra.message);
  }

  if (extra?.error) {
    params.set("error", extra.error);
  }

  const query = params.toString();
  return query ? `${HOME_PATH}?${query}` : HOME_PATH;
}

export function signupRoleCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIGNUP_COOKIE_MAX_AGE_SECONDS,
  };
}
