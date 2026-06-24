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
      execute: async ({ week, day }) => {
        if (!ctx.currentArtifact) {
          return {
            summary: null as string | null,
            message: "No plan in preview.",
          };
        }

        return {
          summary: summarizePlan(ctx.currentArtifact, { week, day }),
        };
      },
    }),
  };
}
