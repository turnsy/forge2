import { tool } from "ai";
import { z } from "zod";
import { buildPythonCodegenRules } from "@/lib/ai/plan-chat/prompts/python-codegen-prompt";
import { summarizePlan } from "@/lib/plans/summarize-plan";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type FoundationToolsContext = {
  currentArtifact: WorkoutPlan | null;
};

export function createFoundationTools(ctx: FoundationToolsContext) {
  return {
    get_plan_codegen_guide: tool({
      description:
        "Returns Python codegen rules and the forge_plan API cheat sheet. You MUST call this before submit_plan_code.",
      inputSchema: z.object({}),
      execute: async () => ({
        guide: buildPythonCodegenRules(),
      }),
    }),

    summarize_current_artifact: tool({
      description:
        "Returns a compact summary of the workout plan currently in the preview. Call when iterating on the in-preview plan or when the user asks about the current draft.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!ctx.currentArtifact) {
          return {
            summary: null as string | null,
            message: "No plan in preview.",
          };
        }

        return {
          summary: summarizePlan(ctx.currentArtifact),
        };
      },
    }),
  };
}
