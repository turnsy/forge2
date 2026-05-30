import { isUserRole } from "@/lib/auth/redirects";
import type { UserRole } from "@/lib/auth/types";

const SIGNUP_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export function signupPathForRole(role: UserRole): string {
  return `/auth/signup/${role}`;
}

export function roleFromSignupPath(pathname: string): UserRole | null {
  return roleFromAuthRolePath(pathname);
}

/** Role from /auth/signup/{role} or /auth/login/{role} — used for OAuth role cookie. */
export function roleFromAuthRolePath(pathname: string): UserRole | null {
  const match = pathname.match(/^\/auth\/(?:signup|login)\/(coach|athlete)(?:\/|$)/);
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
