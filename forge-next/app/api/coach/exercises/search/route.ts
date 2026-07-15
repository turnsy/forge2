import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { createClient } from "@/utils/supabase/data-client";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { query?: unknown };
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ exercises: [] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id,name,normalized_name,owner_coach_id")
    .or(`owner_coach_id.eq.${auth.user.id},owner_coach_id.is.null`)
    .ilike("name", `%${query.replace(/[%_]/g, "")}%`)
    .limit(5);

  if (error) {
    return NextResponse.json({ error: "Exercise search failed" }, { status: 500 });
  }
  return NextResponse.json({ exercises: data ?? [] });
}
