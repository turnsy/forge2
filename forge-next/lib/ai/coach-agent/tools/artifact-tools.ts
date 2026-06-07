import { tool } from "ai";
import { z } from "zod";
import { getCoachPlanById } from "@/lib/plans/repository";
import { toPlanToolSummary } from "@/lib/ai/coach-agent/tools/plan-summaries";
import { toToolNotFound } from "@/lib/ai/coach-agent/tools/db-tool-errors";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ArtifactToolsContext = {
  coachId: string;
  onSetCurrentArtifact: (input: {
    planId: string;
    plan: WorkoutPlan;
    title: string;
  }) => void;
};

export function createArtifactTools(ctx: ArtifactToolsContext) {
  return {
    set_current_artifact: tool({
      description:
        "Load a saved plan into the preview for editing. Use only when the user wants to edit a saved plan that is not already in preview (e.g. \"edit Summer Block\", \"add a week to this plan\"). Does not return full plan JSON.",
      inputSchema: z.object({
        planId: z.string().uuid().describe("Saved plan id."),
      }),
      execute: async ({ planId }) => {
        const result = await getCoachPlanById(ctx.coachId, planId);

        if (result.status === "not_found") {
          return toToolNotFound("Plan");
        }

        if (result.status === "invalid") {
          return {
            ok: false as const,
            code: "invalid" as const,
            message: "Plan data failed validation.",
          };
        }

        const { detail } = result;
        const title = detail.plan.name;

        ctx.onSetCurrentArtifact({
          planId: detail.id,
          plan: detail.plan,
          title,
        });

        return {
          ok: true as const,
          planId: detail.id,
          name: title,
          summary: toPlanToolSummary(detail.plan),
        };
      },
    }),
  };
}
