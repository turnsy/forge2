import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { AuthUser, Profile, UserRole } from "@/lib/auth/types";
import { isUserRole, getRoleMismatchRedirect } from "@/lib/auth/redirects";
import { loginHubPath } from "@/lib/auth/routes";

export const getAuthClaims = cache(async (): Promise<{
  userId: string | null;
  email: string | undefined;
}> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return { userId: null, email: undefined };
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : undefined;

  return { userId: data.claims.sub, email };
});

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, invite_code, contact_info, created_at, deleted_at",
    )
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    role: isUserRole(data.role) ? data.role : null,
    contact_info:
      typeof data.contact_info === "object" && data.contact_info !== null
        ? (data.contact_info as Record<string, unknown>)
        : {},
  };
});

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const { userId, email } = await getAuthClaims();
  if (!userId) {
    return null;
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return null;
  }

  return {
    id: userId,
    email,
    role: profile.role,
    fullName: profile.full_name,
  };
});

export const requireAuth = cache(async (): Promise<AuthUser> => {
  const user = await getAuthUser();
  if (!user) {
    redirect(loginHubPath());
  }

  return user;
});

export const requireRole = cache(async (role: UserRole): Promise<AuthUser> => {
  const user = await requireAuth();
  if (user.role !== role) {
    redirect(getRoleMismatchRedirect(role, user.role));
  }

  return user;
});

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
