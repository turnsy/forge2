import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { listCoachExercises } from "@/lib/exercises/library";

export async function GET(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Math.min(10000, Math.trunc(Number(params.get("page"))) || 1));
  try {
    return NextResponse.json(
      await listCoachExercises(auth.user.id, params.get("q")?.slice(0, 200) ?? "", page),
    );
  } catch {
    return NextResponse.json({ error: "Could not load exercises." }, { status: 500 });
  }
}
