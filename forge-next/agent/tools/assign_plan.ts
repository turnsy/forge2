import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { assignPlanToAthletes } from "@/lib/plans/mutations";
import { getCoachId } from "../lib/coach-context";
import { toToolError } from "../lib/db-tool-errors";

export default defineTool({
  description:
    "Assign or reassign a plan to one or more actively linked athletes. Replaces any active assignment per athlete.",
  inputSchema: z.object({
    planId: z.string().uuid().describe("Plan id to assign."),
    athleteIds: z
      .array(z.string().uuid())
      .min(1)
      .describe("Athlete profile ids."),
  }),
  approval: always(),
  async execute({ planId, athleteIds }, ctx) {
    getCoachId(ctx);
    const result = await assignPlanToAthletes(planId, athleteIds);

    if (!result.ok) {
      return toToolError(result);
    }

    return {
      ok: true as const,
      planId,
      athleteIds,
    };
  },
});
