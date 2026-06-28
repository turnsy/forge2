import type { SessionAuth } from "eve/context";
import { runWithSupabaseCookieHeader } from "@/utils/supabase/data-client";

type ForgeDbContext = {
  session: {
    auth: SessionAuth;
  };
};

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
