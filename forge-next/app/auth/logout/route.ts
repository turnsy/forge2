import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { homePath } from "@/lib/auth/routes";
import { getAuthUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  const user = await getAuthUser();
  const userRole = user?.role ?? null;

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(homePath(userRole), request.url));
}
