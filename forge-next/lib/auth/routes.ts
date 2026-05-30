import { isUserRole } from "@/lib/auth/redirects";
import type { UserRole } from "@/lib/auth/types";

const SIGNUP_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export const LOGIN_HUB_PATH = "/login";
export const SIGNUP_HUB_PATH = "/signup";

export function loginHubPath(): string {
  return LOGIN_HUB_PATH;
}

export function signupHubPath(): string {
  return SIGNUP_HUB_PATH;
}

export function loginPathForRole(role: UserRole): string {
  return `/${role}/login`;
}

export function signupPathForRole(role: UserRole): string {
  return `/${role}/signup`;
}

export function roleFromSignupPath(pathname: string): UserRole | null {
  return roleFromAuthRolePath(pathname);
}

/** Role from /{coach|athlete}/{login|signup} — used for OAuth role cookie. */
export function roleFromAuthRolePath(pathname: string): UserRole | null {
  const match = pathname.match(/^\/(coach|athlete)\/(?:login|signup)(?:\/|$)/);
  return match && isUserRole(match[1]) ? match[1] : null;
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
