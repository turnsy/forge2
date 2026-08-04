import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { listAthleteMaxesWithExerciseNames } from "@/lib/maxes/list-with-exercise-names";
import { insertAthleteMax } from "@/lib/maxes/mutations";
import { normalizeWeightUnit } from "@/lib/maxes/units";

export async function GET() {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;
  return NextResponse.json({ maxes: await listAthleteMaxesWithExerciseNames(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (
    typeof body.exerciseId !== "string" ||
    typeof body.value !== "number" ||
    typeof body.unit !== "string"
  ) {
    return NextResponse.json({ error: "exerciseId, value, and unit are required" }, { status: 400 });
  }

  const unit = normalizeWeightUnit(body.unit);
  if (!unit) {
    return NextResponse.json({ error: "unit must be kg or lb" }, { status: 400 });
  }

  const max = await insertAthleteMax({
    athleteId: auth.user.id,
    exerciseId: body.exerciseId,
    value: body.value,
    unit,
    source: "athlete_entered",
  });
  return NextResponse.json({ max }, { status: 201 });
}
