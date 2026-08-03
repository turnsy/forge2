import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { insertAthleteMax } from "@/lib/maxes/mutations";
import { listAthleteMaxesWithExerciseNames } from "@/lib/maxes/list-with-exercise-names";

type RouteContext = {
  params: Promise<{ athleteId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const { athleteId } = await context.params;
  const relationship = await getCoachAthleteRelationship(athleteId);
  if (!relationship || relationship.status !== "active") {
    return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
  }

  return NextResponse.json({ maxes: await listAthleteMaxesWithExerciseNames(athleteId) });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const { athleteId } = await context.params;
  const relationship = await getCoachAthleteRelationship(athleteId);
  if (!relationship || relationship.status !== "active") {
    return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (
    typeof body.exerciseId !== "string" ||
    typeof body.value !== "number" ||
    typeof body.unit !== "string"
  ) {
    return NextResponse.json(
      { error: "exerciseId, value, and unit are required" },
      { status: 400 },
    );
  }

  const max = await insertAthleteMax({
    athleteId,
    exerciseId: body.exerciseId,
    value: body.value,
    unit: body.unit,
    source: "coach_entered",
  });

  return NextResponse.json({ max }, { status: 201 });
}
