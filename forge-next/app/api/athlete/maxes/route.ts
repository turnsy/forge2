import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { listAthleteMaxesWithExerciseNames } from "@/lib/maxes/list-with-exercise-names";
import { createMaxResponse } from "@/lib/maxes/api";

export async function GET() {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    maxes: await listAthleteMaxesWithExerciseNames(auth.user.id),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;
  return createMaxResponse(request, auth.user.id, "athlete_entered");
}
