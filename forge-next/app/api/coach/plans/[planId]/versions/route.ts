import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { toHttpStatus } from "@/lib/errors/service-error";
import { saveCoachPlanVersion } from "@/lib/plans/mutations";
import { parseSavePlanRequest } from "@/lib/plans/parse-save-plan-request";
import { getCoachPlanById, listCoachPlanVersions } from "@/lib/plans/repository";
import { preparePlanForSave } from "@/lib/plans/utils";

type RouteContext = {
  params: Promise<{ planId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  const { planId } = await context.params;
  const plan = await getCoachPlanById(auth.user.id, planId);

  if (plan.status === "not_found") {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (plan.status === "invalid") {
    return NextResponse.json({ error: "Plan is invalid" }, { status: 422 });
  }

  const versions = await listCoachPlanVersions(auth.user.id, planId);

  return NextResponse.json({ versions });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  const { planId } = await context.params;

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

  const result = await saveCoachPlanVersion(
    planId,
    prepared.plan,
    parsed.body.changeSummary,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: toHttpStatus(result.code) },
    );
  }

  return NextResponse.json({ versionId: result.versionId }, { status: 201 });
}
