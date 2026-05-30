import { cookies } from "next/headers";
import { isUserRole } from "@/lib/auth/redirects";
import type { UserRole } from "@/lib/auth/types";
import { SIGNUP_ROLE_COOKIE } from "@/lib/auth/types";

const SIGNUP_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export function signupPathForRole(role: UserRole): string {
  return `/auth/signup/${role}`;
}

export function roleFromSignupPath(pathname: string): UserRole | null {
  const match = pathname.match(/^\/auth\/signup\/(coach|athlete)(?:\/|$)/);
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

export async function readSignupRoleCookie(): Promise<UserRole | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(SIGNUP_ROLE_COOKIE)?.value;
  return isUserRole(role) ? role : null;
}

export async function consumeSignupRoleCookie(): Promise<UserRole | null> {
  const role = await readSignupRoleCookie();
  if (role) {
    const cookieStore = await cookies();
    cookieStore.delete(SIGNUP_ROLE_COOKIE);
  }
  return role;
}

export async function requireSignupRoleCookie(): Promise<UserRole | null> {
  return readSignupRoleCookie();
}
