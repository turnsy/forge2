import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { listCoachPlans } from "@/lib/plans/repository";
import { getCoachId } from "../lib/coach-context";
import { listInputSchema, toListQuery } from "../lib/list-schema";

export default defineTool({
  description:
    "List workout plans for this coach. Supports optional title search via q.",
  inputSchema: listInputSchema,
  async execute(input, ctx) {
    const coachId = getCoachId(ctx);
    const query = toListQuery(input);
    const result = await listCoachPlans(coachId, query);

    return {
      ok: true as const,
      items: result.items.map((plan) => ({
        id: plan.id,
        name: plan.title,
        weekCount: plan.weekCount,
        createdAt: plan.createdAt,
      })),
      total: result.total,
      hasMore: result.hasMore,
    };
  },
});
