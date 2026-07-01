import type { SessionAuth } from "eve/context";
import { runWithSupabaseCookieHeader } from "@/utils/supabase/data-client";

type ForgeDbContext = {
  session: {
    auth: SessionAuth;
  };
};

/** Threads the Eve auth cookie header into Supabase repository calls.
 *
 * Eve tools run in the agent harness, not inside a Next.js App Router request
 * scope, so `cookies()` from `next/headers` is unavailable there. Channel auth
 * captures the inbound `Cookie` header once; repositories read it via ALS. */
function getCookieHeaderFromSession(session: ForgeDbContext["session"]): string {
  const attributes = session.auth.current?.attributes as
    | { cookieHeader?: string }
    | undefined;

  return attributes?.cookieHeader ?? "";
}

export function withForgeDbContext<T>(
  ctx: ForgeDbContext,
  fn: () => T,
): T {
  return runWithSupabaseCookieHeader(
    getCookieHeaderFromSession(ctx.session),
    fn,
  );
}

export async function withForgeDbContextAsync<T>(
  ctx: ForgeDbContext,
  fn: () => Promise<T>,
): Promise<T> {
  return withForgeDbContext(ctx, fn);
}
