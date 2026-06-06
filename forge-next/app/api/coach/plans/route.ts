import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { listQueryFromUrl } from "@/lib/lists/query";
import { createCoachPlan } from "@/lib/plans/mutations";
import { parseSavePlanRequest } from "@/lib/plans/parse-save-plan-request";
import { preparePlanForSave } from "@/lib/plans/prepare-plan-for-save";
import { listCoachPlans } from "@/lib/plans/repository";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseSavePlanRequest(json);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  const prepared = preparePlanForSave(parsed.body.plan, parsed.body.title);

  if (!prepared.ok) {
    return NextResponse.json({ errors: prepared.errors }, { status: 422 });
  }

  const result = await createCoachPlan(prepared.plan, parsed.body.changeSummary);

  if (!result.ok) {
    const status =
      result.code === "unauthorized"
        ? 401
        : result.code === "not_found"
          ? 404
          : 500;

    return NextResponse.json({ error: result.message }, { status });
  }

  return NextResponse.json(
    { planId: result.planId, versionId: result.versionId },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  const query = listQueryFromUrl(new URL(request.url));
  const result = await listCoachPlans(auth.user.id, query);

  return NextResponse.json(result);
}
