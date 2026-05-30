import "server-only";

import { cookies } from "next/headers";
import { isUserRole } from "@/lib/auth/redirects";
import type { UserRole } from "@/lib/auth/types";
import { SIGNUP_ROLE_COOKIE } from "@/lib/auth/types";

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
