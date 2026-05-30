"use server";

import { redirect } from "next/navigation";
import {
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/auth/actions";
import type { AuthActionResult, AuthProvider } from "@/lib/auth/types";
import { isUserRole } from "@/lib/auth/redirects";
import { FORM_PARSE_ERROR, parseFormData } from "@/lib/forms/parse";
import { loginSchema, signupSchema } from "@/lib/forms/schemas/auth";

function parseFailure(): AuthActionResult {
  return { ok: false, error: FORM_PARSE_ERROR };
}

export async function loginFormAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const parsed = parseFormData(loginSchema, formData);
  if (!parsed.success) {
    return parseFailure();
  }

  const result = await signInWithEmail({
    email: parsed.data.email,
    password: parsed.data.password,
    role: parsed.data.role,
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
  const parsed = parseFormData(signupSchema, formData);
  if (!parsed.success) {
    return parseFailure();
  }

  const result = await signUpWithEmail({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
    role: parsed.data.role,
  });

  if (result.ok) {
    redirect(result.redirectTo);
  }

  return result;
}

export async function oauthFormAction(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "") as AuthProvider;
  const role = String(formData.get("role") ?? "");
  const result = await signInWithOAuth({
    provider,
    role: isUserRole(role) ? role : undefined,
  });

  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
}
