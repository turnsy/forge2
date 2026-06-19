import { tool } from "ai";
import { z } from "zod";
import {
  completeCoachAthleteAssignment,
  unassignCoachAthletePlan,
} from "@/lib/athlete/plan/repository";
import { acceptCoachLink, rejectCoachLink } from "@/lib/links/repository";
import { assignPlanToAthletes } from "@/lib/plans/mutations";
import { toToolError } from "@/lib/ai/coach-agent/tools/db-tool-errors";

export type MutateToolsContext = {
  coachId: string;
};

export function createMutateTools(ctx: MutateToolsContext) {
  return {
    accept_coach_link: tool({
      description:
        "Accept a pending athlete link request. This is a real mutation — confirm intent when ambiguous.",
      inputSchema: z.object({
        relationshipId: z.string().uuid().describe("Pending relationship id."),
      }),
      execute: async ({ relationshipId }) => {
        try {
          await acceptCoachLink(relationshipId);
          return { ok: true as const, relationshipId };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to accept link.";
          return { ok: false as const, message };
        }
      },
    }),

    reject_coach_link: tool({
      description:
        "Reject a pending athlete link request. This is a real mutation — confirm intent when ambiguous.",
      inputSchema: z.object({
        relationshipId: z.string().uuid().describe("Pending relationship id."),
      }),
      execute: async ({ relationshipId }) => {
        try {
          await rejectCoachLink(relationshipId);
          return { ok: true as const, relationshipId };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to reject link.";
          return { ok: false as const, message };
        }
      },
    }),

    assign_plan: tool({
      description:
        "Assign or reassign a plan to one or more actively linked athletes. Replaces any active assignment per athlete.",
      inputSchema: z.object({
        planId: z.string().uuid().describe("Plan id to assign."),
        athleteIds: z
          .array(z.string().uuid())
          .min(1)
          .describe("Athlete profile ids."),
      }),
      execute: async ({ planId, athleteIds }) => {
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
    }),

    unassign_plan: tool({
      description:
        "Unassign an athlete's active plan. Marks the current assignment as unassigned.",
      inputSchema: z.object({
        athleteId: z.string().uuid().describe("Athlete profile id."),
      }),
      execute: async ({ athleteId }) => {
        const result = await unassignCoachAthletePlan(ctx.coachId, athleteId);

        if (!result.ok) {
          return toToolError(result);
        }

        return {
          ok: true as const,
          athleteId,
        };
      },
    }),

    mark_assignment_complete: tool({
      description:
        "Force-complete an athlete's active assignment. Sets status to completed.",
      inputSchema: z.object({
        athleteId: z.string().uuid().describe("Athlete profile id."),
      }),
      execute: async ({ athleteId }) => {
        const result = await completeCoachAthleteAssignment(
          ctx.coachId,
          athleteId,
        );

        if (!result.ok) {
          return toToolError(result);
        }

        return {
          ok: true as const,
          athleteId,
        };
      },
    }),
  };
}
