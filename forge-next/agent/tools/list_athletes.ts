import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { getCoachId } from "../lib/coach-context";
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
