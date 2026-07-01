import { cookies } from "next/headers";
import {
  createClient as createDataClient,
  registerNextCookieStoreFactory,
} from "@/utils/supabase/data-client";

registerNextCookieStoreFactory(async () => {
  const cookieStore = await cookies();

  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      } catch {
        // Called from a Server Component; proxy refreshes sessions.
      }
    },
  };
});

export async function createClient() {
  return createDataClient();
}
