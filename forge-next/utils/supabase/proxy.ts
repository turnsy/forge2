import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  roleFromAuthRolePath,
  signupRoleCookieOptions,
} from "@/lib/auth/routes";
import { SIGNUP_ROLE_COOKIE } from "@/lib/auth/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  await supabase.auth.getClaims();

  const signupRole = roleFromAuthRolePath(request.nextUrl.pathname);
  if (signupRole) {
    supabaseResponse.cookies.set(
      SIGNUP_ROLE_COOKIE,
      signupRole,
      signupRoleCookieOptions(),
    );
  }

  return supabaseResponse;
};
