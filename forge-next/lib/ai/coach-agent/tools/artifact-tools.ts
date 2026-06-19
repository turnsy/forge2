import { tool } from "ai";
import { z } from "zod";
import { getCoachAthleteActiveAssignment } from "@/lib/athlete/plan/repository";
import { getCoachPlanById } from "@/lib/plans/repository";
import { countAssignmentEditability } from "@/lib/plans/assignment-editability";
import { summarizePlan } from "@/lib/plans/summarize-plan";
import { toToolNotFound } from "@/lib/ai/coach-agent/tools/db-tool-errors";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ArtifactToolsContext = {
  coachId: string;
  onSetCurrentArtifact: (input: {
    planId?: string;
    assignmentId?: string;
    plan: WorkoutPlan;
    title: string;
  }) => void;
  onClearCurrentArtifact: () => void;
};

const artifactRefSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("plan"),
    id: z.string().uuid().describe("Saved plan id."),
  }),
  z.object({
    type: z.literal("assignment"),
    id: z.string().uuid().describe("Athlete profile id."),
  }),
]);

export function createArtifactTools(ctx: ArtifactToolsContext) {
  return {
    set_current_artifact: tool({
      description:
        "Load a saved plan or an athlete's active assignment into the preview for editing. Use for saved plans (type=plan) or in-progress athlete assignments (type=assignment). Does not return full plan JSON.",
      inputSchema: artifactRefSchema,
      execute: async ({ type, id }) => {
        if (type === "plan") {
          const result = await getCoachPlanById(ctx.coachId, id);

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
            type: "plan" as const,
            planId: detail.id,
            name: title,
            summary: summarizePlan(detail.plan),
          };
        }

        const result = await getCoachAthleteActiveAssignment(ctx.coachId, id);

        if (!result.ok) {
          return {
            ok: false as const,
            code: "db_error" as const,
            message: result.message,
          };
        }

        if (!result.plan) {
          return toToolNotFound("Active assignment");
        }

        const { plan: assignment } = result;
        const title = assignment.plan.name;
        const { editableDayCount, lockedDayCount } = countAssignmentEditability(
          assignment.plan,
        );

        ctx.onSetCurrentArtifact({
          assignmentId: assignment.id,
          plan: assignment.plan,
          title,
        });

        return {
          ok: true as const,
          type: "assignment" as const,
          assignmentId: assignment.id,
          athleteId: assignment.athleteId,
          name: title,
          summary: summarizePlan(assignment.plan),
          editableDayCount,
          lockedDayCount,
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
