import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { updateAthleteMax } from "@/lib/maxes/mutations";

type RouteContext = {
  params: Promise<{ athleteId: string; maxId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const { athleteId, maxId } = await context.params;
  const relationship = await getCoachAthleteRelationship(athleteId);
  if (!relationship || relationship.status !== "active") {
    return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.value !== "number" || typeof body.unit !== "string") {
    return NextResponse.json({ error: "value and unit are required" }, { status: 400 });
  }

  try {
    const max = await updateAthleteMax({
      maxId,
      value: body.value,
      unit: body.unit,
    });
    return NextResponse.json({ max });
  } catch {
    return NextResponse.json({ error: "Max not found" }, { status: 404 });
  }
}
