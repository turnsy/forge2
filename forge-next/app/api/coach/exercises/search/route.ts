import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import {
  mergeExerciseSearchOptions,
  searchExercises,
  searchExercisesByText,
} from "@/lib/exercises/search";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { query?: unknown };
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ exercises: [] });

  const textResults = await searchExercisesByText(query, auth.user.id, 5);

  try {
    const semanticResults = await searchExercises(query, auth.user.id, 5);
    const exercises = mergeExerciseSearchOptions(
      [
        textResults,
        semanticResults.map((exercise) => ({ id: exercise.id, name: exercise.name })),
      ],
      5,
    );
    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ exercises: textResults });
  }
}
