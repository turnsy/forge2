import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { listCoachPlanVersions, listCoachPlans } from "@/lib/plans/repository";
import { summarizePlan } from "@/lib/plans/summarize-plan";
import { getCoachId } from "../lib/coach-context";
import { toToolNotFound } from "../lib/db-tool-errors";
import { fetchCoachPlanForTool } from "../lib/plans";
import { listInputSchema, toListQuery } from "../lib/list-schema";

export default defineTool({
  description:
    "List linked athletes for this coach. Supports optional name search via q.",
  inputSchema: listInputSchema,
  async execute(input, ctx) {
    getCoachId(ctx);
    const query = toListQuery(input);
    const result = await listCoachAthletes(query);

    return {
      ok: true as const,
      items: result.items.map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        currentPlanId: athlete.currentPlanId,
        currentPlanName: athlete.currentPlanName,
        joinedAt: athlete.joinedAt,
      })),
      total: result.total,
      hasMore: result.hasMore,
    };
  },
});
