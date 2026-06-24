import {
  getCoachPlanById,
  type CoachPlanDetail,
} from "@/lib/plans/repository";
import { toToolNotFound } from "@/lib/ai/coach-agent/tools/db-tool-errors";

export type FetchedCoachPlan =
  | { ok: true; detail: CoachPlanDetail }
  | { ok: false; notFound: ReturnType<typeof toToolNotFound> }
  | { ok: false; code: "invalid"; message: string };

export async function fetchCoachPlanForTool(
  coachId: string,
  planId: string,
): Promise<FetchedCoachPlan> {
  const result = await getCoachPlanById(coachId, planId);

  if (result.status === "not_found") {
    return { ok: false, notFound: toToolNotFound("Plan") };
  }

  if (result.status === "invalid") {
    return {
      ok: false,
      code: "invalid",
      message: "Plan data failed validation.",
    };
  }

  return { ok: true, detail: result.detail };
}
