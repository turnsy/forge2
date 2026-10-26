import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { listAthleteMaxesWithExerciseNames } from "@/lib/maxes/list-with-exercise-names";
import { createMaxResponse } from "@/lib/maxes/api";

type RouteContext = { params: Promise<{ athleteId: string }> };

async function authorize(context: RouteContext) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return { response: auth.response };
  const { athleteId } = await context.params;
  const relationship = await getCoachAthleteRelationship(athleteId);
  if (!relationship || relationship.status !== "active") {
    return {
      response: NextResponse.json(
        { error: "Athlete not found" },
        { status: 404 },
      ),
    };
  }
  return { athleteId };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await authorize(context);
  if (auth.response) return auth.response;
  return NextResponse.json({
    maxes: await listAthleteMaxesWithExerciseNames(auth.athleteId!),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorize(context);
  if (auth.response) return auth.response;
  return createMaxResponse(request, auth.athleteId!, "coach_entered");
}
