import { tool } from "ai";
import { z } from "zod";
import { fetchCoachPlanForTool } from "@/lib/ai/coach-agent/tools/fetch-coach-plan";
import { summarizePlan } from "@/lib/plans/summarize-plan";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ArtifactToolsContext = {
  coachId: string;
  onSetCurrentArtifact: (input: {
    planId: string;
    plan: WorkoutPlan;
    title: string;
  }) => void;
  onClearCurrentArtifact: () => void;
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
        const result = await fetchCoachPlanForTool(ctx.coachId, planId);

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

        ctx.onSetCurrentArtifact({
          planId: detail.id,
          plan: detail.plan,
          title,
        });

        return {
          ok: true as const,
          planId: detail.id,
          name: title,
          summary: summarizePlan(detail.plan),
        };
      },
    }),

    clear_current_artifact: tool({
      description:
        "Clear the current plan artifact so a brand-new plan can be created from scratch. Use only when the user explicitly asks for a new plan — not when iterating on the current plan.",
      inputSchema: z.object({}),
      execute: async () => {
        ctx.onClearCurrentArtifact();
        return {
          ok: true as const,
          message: "Current plan cleared. Ready for a new plan.",
        };
      },
    }),
  };
}
