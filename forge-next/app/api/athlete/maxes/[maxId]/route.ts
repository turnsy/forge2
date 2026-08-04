import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { updateAthleteMax } from "@/lib/maxes/mutations";

type RouteContext = {
  params: Promise<{ maxId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;

  const { maxId } = await context.params;
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

    if (max.athlete_id !== auth.user.id) {
      return NextResponse.json({ error: "Max not found" }, { status: 404 });
    }

    return NextResponse.json({ max });
  } catch {
    return NextResponse.json({ error: "Max not found" }, { status: 404 });
  }
}
