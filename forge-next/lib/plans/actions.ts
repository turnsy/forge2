"use server";

import { revalidatePath } from "next/cache";
import {
  assignPlanToAthletes,
  deleteCoachPlan,
} from "@/lib/plans/mutations";
import type { PlanActionResult } from "@/lib/plans/types";

function failure(error: string): PlanActionResult {
  return { ok: false, error };
}

function success(): PlanActionResult {
  return { ok: true };
}

export async function assignPlanToAthletesAction(
  planId: string,
  athleteIds: string[],
): Promise<PlanActionResult> {
  const result = await assignPlanToAthletes(planId, athleteIds);

  if (!result.ok) {
    return failure(result.message);
  }

  revalidatePath("/coach/plans");
  revalidatePath(`/coach/plans/${planId}`);
  revalidatePath("/coach/athletes");

  for (const athleteId of athleteIds) {
    revalidatePath(`/coach/athletes/${athleteId}`);
  }

  return success();
}

export async function assignPlanToAthleteAction(
  planId: string,
  athleteId: string,
): Promise<PlanActionResult> {
  return assignPlanToAthletesAction(planId, [athleteId]);
}

export async function deleteCoachPlanAction(planId: string): Promise<PlanActionResult> {
  const result = await deleteCoachPlan(planId);

  if (!result.ok) {
    return failure(result.message);
  }

  revalidatePath("/coach/plans");
  revalidatePath("/coach/athletes");

  return success();
}
