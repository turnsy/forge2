import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { summarizePlan } from "@/lib/plans/summarize-plan";
import { setCoachArtifact } from "../lib/coach-artifact-state";
import { getCoachId } from "../lib/coach-context";
import { fetchCoachPlanForTool } from "../lib/plans";
import type {
  SetCurrentArtifactOutput,
} from "@/lib/chat/adapters/plan/forge-tool-outputs";

export default defineTool({
  description:
    "Load a saved plan into the preview for editing. Use only when the user wants to edit a saved plan that is not already in preview (e.g. \"edit Summer Block\", \"add a week to this plan\"). Does not return full plan JSON.",
  inputSchema: z.object({
    planId: z.string().uuid().describe("Saved plan id."),
  }),
  async execute({ planId }, ctx): Promise<SetCurrentArtifactOutput> {
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
    const title = detail.plan.name;

    setCoachArtifact({
      planId: detail.id,
      plan: detail.plan,
      title,
    });

    return {
      ok: true as const,
      planId: detail.id,
      name: title,
      summary: summarizePlan(detail.plan),
      plan: detail.plan,
    };
  },
  toModelOutput(output) {
    if (output.ok && "summary" in output) {
      return {
        type: "json",
        value: {
          ok: true,
          planId: output.planId,
          name: output.name,
          summary: output.summary,
        },
      };
    }
    return { type: "json", value: output };
  },
});
