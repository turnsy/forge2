"use server";

import { redirect } from "next/navigation";
import {
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/auth/actions";
import type { AuthActionResult, AuthProvider } from "@/lib/auth/types";

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
  const result = await signUpWithEmail({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
  });

  if (result.ok) {
    redirect(result.redirectTo);
  }

  return result;
}

export async function oauthFormAction(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "") as AuthProvider;
  const result = await signInWithOAuth({ provider });

  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
}
