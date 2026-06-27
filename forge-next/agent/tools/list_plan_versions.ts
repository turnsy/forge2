import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { listCoachPlanVersions } from "@/lib/plans/repository";
import { getCoachId } from "../lib/coach-context";
import { toToolNotFound } from "../lib/db-tool-errors";

export default defineTool({
  description: "List version history metadata for a plan. No plan_data blobs.",
  inputSchema: z.object({
    planId: z.string().uuid().describe("Plan id."),
  }),
  async execute({ planId }, ctx) {
    const coachId = getCoachId(ctx);
    try {
      const versions = await listCoachPlanVersions(coachId, planId);

      return {
        ok: true as const,
        items: versions.map((version) => ({
          id: version.id,
          changeSummary: version.changeSummary,
          createdAt: version.createdAt,
          isActive: version.isActive,
        })),
      };
    } catch {
      return toToolNotFound("Plan");
    }
  },
});
