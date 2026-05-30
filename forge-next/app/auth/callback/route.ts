import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  completeRoleSelection,
  finalizeOAuthSignup,
} from "@/lib/auth/actions";
import {
  getPostAuthRedirect,
  isUserRole,
  validateRedirectPath,
} from "@/lib/auth/redirects";
import { getProfile } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = validateRedirectPath(searchParams.get("next"));
  const cookieRole = await finalizeOAuthSignup();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (userId) {
      const profile = await getProfile(userId);

      if (!profile?.role && cookieRole) {
        const result = await completeRoleSelection({ role: cookieRole });
        if (result.ok) {
          return NextResponse.redirect(`${origin}${result.redirectTo}`);
        }
      }

      const metadataRole = claimsData?.claims?.role;
      const role = profile?.role ?? (isUserRole(metadataRole) ? metadataRole : null);
      const redirectTo =
        next === "/" ? getPostAuthRedirect(role) : next;

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
