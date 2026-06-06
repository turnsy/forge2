import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { listQueryFromUrl } from "@/lib/lists/query";
import { listCoachPlans } from "@/lib/plans/repository";

export async function GET(request: Request) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  const query = listQueryFromUrl(new URL(request.url));
  const result = await listCoachPlans(auth.user.id, query);

  return NextResponse.json(result);
}
