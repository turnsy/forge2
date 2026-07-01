import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { summarizePlan } from "@/lib/plans/summarize-plan";
import { getCoachId } from "../lib/coach-context";
import { fetchCoachPlanForTool } from "../lib/plans";

export default defineTool({
  description:
    "Get plan metadata and a compact summary. Never returns full plan JSON.",
  inputSchema: z.object({
    planId: z.string().uuid().describe("Plan id."),
  }),
  async execute({ planId }, ctx) {
    const coachId = getCoachId(ctx);
    const result = await fetchCoachPlanForTool(coachId, planId);

    if (!result.ok) {
      if ("notFound" in result) {
        return result.notFound;
      }

      return {
        ok: false as const,
        code: result.code,
        message: result.message,
      };
    }

    const { detail } = result;

    return {
      ok: true as const,
      id: detail.id,
      name: detail.plan.name,
      createdAt: detail.createdAt,
      summary: summarizePlan(detail.plan),
    };
  },
});
