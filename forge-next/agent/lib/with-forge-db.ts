import type { SessionContext } from "eve/tools";
import { runWithSupabaseCookieHeader } from "@/utils/supabase/data-client";

function getCookieHeaderFromSession(session: SessionContext["session"]): string {
  const attributes = session.auth.current?.attributes as
    | { cookieHeader?: string }
    | undefined;

  return attributes?.cookieHeader ?? "";
}

export function withForgeDbContext<T>(
  ctx: SessionContext,
  fn: () => T,
): T {
  return runWithSupabaseCookieHeader(
    getCookieHeaderFromSession(ctx.session),
    fn,
  );
}

export async function withForgeDbContextAsync<T>(
  ctx: SessionContext,
  fn: () => Promise<T>,
): Promise<T> {
  return withForgeDbContext(ctx, fn);
}
