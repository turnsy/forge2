"use server";

import { redirect } from "next/navigation";
import {
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/auth/actions";
import { isUserRole } from "@/lib/auth/redirects";
import { homePath } from "@/lib/auth/routes";
import { writeSignupRoleCookie } from "@/lib/auth/signup-cookies";
import type { AuthActionResult, AuthProvider, UserRole } from "@/lib/auth/types";

export async function setSignupRoleCookieAction(role: UserRole): Promise<void> {
  await writeSignupRoleCookie(role);
}

export async function loginFormAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const result = await signInWithEmail({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (result.ok) {
    redirect(result.redirectTo);
  }

  return result;
}

export async function signupFormAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const role = String(formData.get("role") ?? "");
  const result = await signUpWithEmail({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
    role: isUserRole(role) ? role : undefined,
  });

  if (result.ok) {
    redirect(result.redirectTo);
  }

  return result;
}

export async function oauthFormAction(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "") as AuthProvider;
  const role = String(formData.get("role") ?? "");
  const signupRole = isUserRole(role) ? role : undefined;

  if (signupRole) {
    await writeSignupRoleCookie(signupRole);
  }

  const result = await signInWithOAuth({
    provider,
    role: signupRole,
  });

  if (!result.ok) {
    redirect(homePath(signupRole, { error: result.error }));
  }
}
