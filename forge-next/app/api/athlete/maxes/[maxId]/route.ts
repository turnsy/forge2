import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { deleteAthleteMax } from "@/lib/maxes/mutations";

type RouteContext = {
  params: Promise<{ maxId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;

  const { maxId } = await context.params;

  try {
    await deleteAthleteMax(maxId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Max not found" }, { status: 404 });
  }
}
