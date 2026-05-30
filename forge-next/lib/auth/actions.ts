"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getAuthCallbackUrl,
  getOAuthRedirectTo,
  getPostAuthRedirect,
  isUserRole,
  validateRedirectPath,
} from "@/lib/auth/redirects";
import type {
  AuthActionResult,
  AuthProvider,
  UserRole,
} from "@/lib/auth/types";
import { SIGNUP_ROLE_COOKIE } from "@/lib/auth/types";

function failure(error: string): AuthActionResult {
  return { ok: false, error };
}

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

async function setSignupRoleCookie(role: UserRole): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SIGNUP_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

async function consumeSignupRoleCookie(): Promise<UserRole | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(SIGNUP_ROLE_COOKIE)?.value;
  cookieStore.delete(SIGNUP_ROLE_COOKIE);

  return isUserRole(role) ? role : null;
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  next?: string;
}): Promise<AuthActionResult> {
  const origin = await getOrigin();
  const next = validateRedirectPath(input.next);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        full_name: input.fullName,
      },
      emailRedirectTo: getAuthCallbackUrl(origin, next),
    },
  });

  if (error) {
    return failure(error.message);
  }

  if (data.session) {
    const profileRole = isUserRole(data.user?.user_metadata?.role)
      ? data.user.user_metadata.role
      : input.role;
    return { ok: true, redirectTo: getPostAuthRedirect(profileRole) };
  }

  return {
    ok: true,
    redirectTo: "/login?message=check-email",
  };
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthActionResult> {
  const next = validateRedirectPath(input.next);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    return failure(error.message);
  }

  const role = isUserRole(data.user?.user_metadata?.role)
    ? data.user.user_metadata.role
    : null;

  return {
    ok: true,
    redirectTo: next === "/" ? getPostAuthRedirect(role) : next,
  };
}

export async function signInWithOAuth(input: {
  provider: AuthProvider;
  role?: UserRole;
  next?: string;
}): Promise<AuthActionResult> {
  const origin = await getOrigin();
  const next = validateRedirectPath(input.next);
  const supabase = await createClient();

  if (input.role) {
    await setSignupRoleCookie(input.role);
  }

  const redirectTo = getOAuthRedirectTo(origin, input.provider, input.role);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: input.provider,
    options: {
      redirectTo,
      queryParams:
        input.provider === "apple"
          ? { scope: "name email" }
          : undefined,
    },
  });

  if (error) {
    return failure(error.message);
  }

  if (!data.url) {
    return failure("OAuth provider did not return a redirect URL.");
  }

  redirect(data.url);
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<AuthActionResult> {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return failure(error.message);
  }

  return { ok: true, redirectTo: "/login?message=reset-email-sent" };
}

export async function completeRoleSelection(input: {
  role: UserRole;
  fullName?: string;
}): Promise<AuthActionResult> {
  if (!isUserRole(input.role)) {
    return failure("Role must be coach or athlete.");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return failure("You must be signed in to choose a role.");
  }

  const userId = claimsData.claims.sub;
  const metadata: Record<string, string> = { role: input.role };
  if (input.fullName) {
    metadata.full_name = input.fullName;
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (metadataError) {
    return failure(metadataError.message);
  }

  const { error: profileError } = await supabase.rpc("complete_profile_role", {
    target_role: input.role,
    target_full_name: input.fullName ?? null,
  });

  if (profileError) {
    return failure(profileError.message);
  }

  return { ok: true, redirectTo: getPostAuthRedirect(input.role) };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function finalizeOAuthSignup(): Promise<UserRole | null> {
  return consumeSignupRoleCookie();
}

export { consumeSignupRoleCookie, getPostAuthRedirect, validateRedirectPath };
