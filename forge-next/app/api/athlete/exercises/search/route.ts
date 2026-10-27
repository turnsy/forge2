import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { getAthleteCoachLink } from "@/lib/links/repository";
import { searchExercisesByText } from "@/lib/exercises/search";

export async function POST(request: Request) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;

  const link = await getAthleteCoachLink();
  if (!link || link.status !== "active") {
    return NextResponse.json({ exercises: [] });
  }

  const body = (await request.json().catch(() => ({}))) as { query?: unknown };
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ exercises: [] });

  try {
    const exercises = await searchExercisesByText(query, link.coachId, 5, false);
    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ error: "Could not search exercises" }, { status: 500 });
  }
}
