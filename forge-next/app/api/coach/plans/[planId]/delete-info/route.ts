import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { toHttpStatus } from "@/lib/errors/service-error";
import { getCoachPlanDeleteInfo } from "@/lib/plans/mutations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ planId: string }> },
) {
  const auth = await requireApiRole("coach");

  if (!auth.ok) {
    return auth.response;
  }

  const { planId } = await context.params;
  const result = await getCoachPlanDeleteInfo(planId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: toHttpStatus(result.code) },
    );
  }

  return NextResponse.json({
    planTitle: result.planTitle,
    activeAssignmentCount: result.activeAssignmentCount,
  });
}
