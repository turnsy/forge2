import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseFromCookieHeader(
  cookieHeader: string,
): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const cookies = parseCookieHeader(cookieHeader);

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookies.flatMap((cookie) =>
          cookie.value === undefined
            ? []
            : [{ name: cookie.name, value: cookie.value }],
        );
      },
      setAll() {},
    },
  });
}
