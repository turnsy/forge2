import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { confirmExerciseSelection } from "@/lib/exercises/confirm-selection";
import { getAthleteCoachLink } from "@/lib/links/repository";

export async function POST(request: Request) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;

  const link = await getAthleteCoachLink();
  if (!link || link.status !== "active") {
    return NextResponse.json({ error: "Coach link required" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    exerciseId?: unknown;
    name?: unknown;
  };

  if (!body.exerciseId || typeof body.exerciseId !== "string") {
    return NextResponse.json({ error: "Select an existing exercise. Only coaches can create exercises." }, { status: 403 });
  }

  try {
    const exercise = await confirmExerciseSelection(
      {
        exerciseId: typeof body.exerciseId === "string" ? body.exerciseId : undefined,
      },
      link.coachId,
      false,
    );
    return NextResponse.json({ exercise });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Exercise confirmation failed" },
      { status: 422 },
    );
  }
}
