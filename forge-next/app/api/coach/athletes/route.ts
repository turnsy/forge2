import { NextResponse } from "next/server";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { requireApiRole } from "@/lib/auth/api";
import { listQueryFromUrl } from "@/lib/lists/query";

export async function GET(request: Request) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  const query = listQueryFromUrl(new URL(request.url));
  const result = await listCoachAthletes(query);

  return NextResponse.json(result);
}
