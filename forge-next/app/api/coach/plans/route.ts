import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { toHttpStatus } from "@/lib/errors/service-error";
import { listQueryFromUrl } from "@/lib/lists/query";
import { createCoachPlan } from "@/lib/plans/mutations";
import { parseSavePlanRequest } from "@/lib/plans/parse-save-plan-request";
import { listCoachPlans } from "@/lib/plans/repository";
import { preparePlanForSave } from "@/lib/plans/utils";
import { preparePlanExerciseResolution } from "@/lib/exercises/prepare-plan";

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

  let resolvedPlan;
  try {
    resolvedPlan = await preparePlanExerciseResolution(prepared.plan, auth.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Exercise resolution failed" },
      { status: 422 },
    );
  }
  const result = await createCoachPlan(resolvedPlan, parsed.body.changeSummary);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: toHttpStatus(result.code) },
    );
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
