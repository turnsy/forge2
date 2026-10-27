import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { searchExercisesByText } from "@/lib/exercises/search";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { query?: unknown };
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ exercises: [] });

  try {
    const exercises = await searchExercisesByText(query, auth.user.id, 5);
    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ error: "Could not search exercises" }, { status: 500 });
  }
}
