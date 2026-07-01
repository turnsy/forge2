import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { coachArtifact } from "../lib/coach-artifact-state";
import { summarizePlan } from "@/lib/plans/summarize-plan";

export default defineTool({
  description:
    "Returns a compact summary of the workout plan currently in the preview. Call when iterating on the in-preview plan or when the user asks about the current draft. Pass week (0-based) to focus on one week; pass week and day for full set breakdown on that day.",
  inputSchema: z.object({
    week: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("0-based week index (same as plan.week(n))."),
    day: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        "0-based day index within the week. Requires week. Includes reps/target per set when both are provided.",
      ),
  }),
  async execute({ week, day }) {
    const { plan } = coachArtifact.get();
    if (!plan) {
      return {
        summary: null as string | null,
        message: "No plan in preview.",
      };
    }

    return {
      summary: summarizePlan(plan, { week, day }),
    };
  },
});
