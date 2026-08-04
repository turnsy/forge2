import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { confirmExerciseSelection } from "@/lib/exercises/confirm-selection";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    exerciseId?: unknown;
    name?: unknown;
  };

  try {
    const exercise = await confirmExerciseSelection(
      {
        exerciseId: typeof body.exerciseId === "string" ? body.exerciseId : undefined,
        name: typeof body.name === "string" ? body.name : undefined,
      },
      auth.user.id,
    );
    return NextResponse.json({ exercise });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Exercise confirmation failed" },
      { status: 422 },
    );
  }
}
