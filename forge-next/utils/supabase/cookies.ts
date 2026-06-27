import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header.trim()) {
    return [];
  }

  return header.split(";").flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) {
      return [];
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      return [];
    }

    return [
      {
        name: trimmed.slice(0, separator),
        value: trimmed.slice(separator + 1),
      },
    ];
  });
}

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
        return cookies;
      },
      setAll() {},
    },
  });
}
