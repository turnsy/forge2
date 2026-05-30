"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  isOAuthProviderEnabled,
  oauthProviderUnavailableMessage,
} from "@/lib/auth/providers";
import {
  getAuthCallbackUrl,
  getOAuthRedirectTo,
  getPostAuthRedirect,
  isUserRole,
  validateRedirectPath,
} from "@/lib/auth/redirects";
import {
  consumeSignupRoleCookie,
  requireSignupRoleCookie,
} from "@/lib/auth/signup-cookies";
import type { AuthActionResult, AuthProvider } from "@/lib/auth/types";

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

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
  next?: string;
}): Promise<AuthActionResult> {
  const role = await requireSignupRoleCookie();
  if (!role) {
    return failure("Start signup from /coach/signup or /athlete/signup.");
  }

  const origin = await getOrigin();
  const next = validateRedirectPath(input.next);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role,
        full_name: input.fullName,
      },
      emailRedirectTo: getAuthCallbackUrl(origin, next),
    },
  });

  if (error) {
    return failure(error.message);
  }

  if (data.session) {
    await consumeSignupRoleCookie();
    const profileRole = isUserRole(data.user?.user_metadata?.role)
      ? data.user.user_metadata.role
      : role;
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role =
    (isUserRole(profile?.role) ? profile.role : null) ??
    (isUserRole(data.user.user_metadata?.role)
      ? data.user.user_metadata.role
      : null);

  return {
    ok: true,
    redirectTo: next === "/" ? getPostAuthRedirect(role) : next,
  };
}

export async function signInWithOAuth(input: {
  provider: AuthProvider;
  next?: string;
}): Promise<AuthActionResult> {
  if (!isOAuthProviderEnabled(input.provider)) {
    return failure(oauthProviderUnavailableMessage(input.provider));
  }

  const origin = await getOrigin();
  const next = validateRedirectPath(input.next);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: input.provider,
    options: {
      redirectTo: getOAuthRedirectTo(origin, next),
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
  fullName?: string;
}): Promise<AuthActionResult> {
  const role = await requireSignupRoleCookie();
  if (!role) {
    return failure("Start signup from /coach/signup or /athlete/signup.");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return failure("You must be signed in to complete signup.");
  }

  const metadata: Record<string, string> = { role };
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
    target_role: role,
    target_full_name: input.fullName ?? null,
  });

  if (profileError) {
    return failure(profileError.message);
  }

  await consumeSignupRoleCookie();

  return { ok: true, redirectTo: getPostAuthRedirect(role) };
}
