import { AsyncLocalStorage } from "node:async_hooks";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseFromCookieHeader } from "@/utils/supabase/cookies";

type SupabaseContext = {
  cookieHeader?: string;
};

type CookieStore = {
  getAll(): { name: string; value: string }[];
  setAll(
    cookies: {
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }[],
  ): void;
};

const supabaseContext = new AsyncLocalStorage<SupabaseContext>();

let nextCookieStoreFactory: (() => Promise<CookieStore>) | null = null;

export function registerNextCookieStoreFactory(
  factory: () => Promise<CookieStore>,
): void {
  nextCookieStoreFactory = factory;
}

export function runWithSupabaseCookieHeader<T>(
  cookieHeader: string,
  fn: () => T,
): T {
  return supabaseContext.run({ cookieHeader }, fn);
}

export async function createClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const context = supabaseContext.getStore();
  if (context?.cookieHeader !== undefined) {
    return createSupabaseFromCookieHeader(context.cookieHeader);
  }

  if (nextCookieStoreFactory) {
    const cookieStore = await nextCookieStoreFactory();
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookieStore.setAll(cookiesToSet);
        },
      },
    });
  }

  throw new Error(
    "Supabase client unavailable: missing request cookie context.",
  );
}
