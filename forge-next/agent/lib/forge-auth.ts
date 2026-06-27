import { createServerClient } from "@supabase/ssr";
import type { AuthUser } from "@/lib/auth/types";
import { isUserRole } from "@/lib/auth/redirects";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import { parseCookieHeader } from "@/utils/supabase/cookies";

function parseCookieHeaderFromRequest(request: Request): { name: string; value: string }[] {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return parseCookieHeader(cookieHeader);
}

export async function getAuthUserFromRequest(
  request: Request,
): Promise<AuthUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookieHeaderFromRequest(request);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookies;
      },
      setAll() {},
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return null;
  }

  const userId = data.claims.sub;
  const email =
    typeof data.claims.email === "string" ? data.claims.email : undefined;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: userId,
    email,
    role: isUserRole(profile.role) ? profile.role : null,
    fullName: profile.full_name,
  };
}

export function getForgeSessionIdFromRequest(request: Request): string | null {
  const value = request.headers.get(FORGE_SESSION_HEADER)?.trim();
  return value && value.length > 0 ? value : null;
}
