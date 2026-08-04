import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { deleteAthleteMax } from "@/lib/maxes/mutations";

type RouteContext = {
  params: Promise<{ athleteId: string; maxId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const { athleteId, maxId } = await context.params;
  const relationship = await getCoachAthleteRelationship(athleteId);
  if (!relationship || relationship.status !== "active") {
    return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
  }

  try {
    await deleteAthleteMax(maxId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Max not found" }, { status: 404 });
  }
}
