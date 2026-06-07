import { tool } from "ai";
import { z } from "zod";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { listCoachPendingInvites } from "@/lib/links/repository";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import {
  getCoachPlanById,
  listCoachPlanVersions,
  listCoachPlans,
} from "@/lib/plans/repository";
import { normalizeListQuery } from "@/lib/lists/query";
import { toPlanToolSummary } from "@/lib/ai/coach-agent/tools/plan-summaries";
import { toToolNotFound } from "@/lib/ai/coach-agent/tools/db-tool-errors";

export type ReadToolsContext = {
  coachId: string;
};

const listInputSchema = z.object({
  q: z.string().optional().describe("Optional search query."),
  page: z.number().int().min(1).optional().describe("Page number (default 1)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Page size (default 10)."),
});

function toListQuery(input: z.infer<typeof listInputSchema>) {
  return normalizeListQuery({
    q: input.q,
    page: input.page,
    limit: input.limit,
  });
}

export function createReadTools(ctx: ReadToolsContext) {
  return {
    list_athletes: tool({
      description:
        "List linked athletes for this coach. Supports optional name search via q.",
      inputSchema: listInputSchema,
      execute: async (input) => {
        const query = toListQuery(input);
        const result = await listCoachAthletes(query);

        return {
          ok: true as const,
          items: result.items.map((athlete) => ({
            id: athlete.id,
            name: athlete.name,
            currentPlanId: athlete.currentPlanId,
            currentPlanName: athlete.currentPlanName,
            joinedAt: athlete.joinedAt,
          })),
          total: result.total,
          hasMore: result.hasMore,
        };
      },
    }),

    get_athlete: tool({
      description:
        "Get one athlete's relationship and current assignment metadata. Does not return workout content.",
      inputSchema: z.object({
        athleteId: z.string().uuid().describe("Athlete profile id."),
      }),
      execute: async ({ athleteId }) => {
        const relationship = await getCoachAthleteRelationship(athleteId);

        if (!relationship) {
          return toToolNotFound("Athlete");
        }

        return {
          ok: true as const,
          athleteId: relationship.athleteId,
          name: relationship.athleteName,
          email: relationship.athleteEmail,
          status: relationship.status,
          linkedAt: relationship.linkedAt,
          currentPlanId: relationship.currentPlanId,
          currentPlanName: relationship.currentPlanName,
        };
      },
    }),

    list_plans: tool({
      description:
        "List workout plans for this coach. Supports optional title search via q.",
      inputSchema: listInputSchema,
      execute: async (input) => {
        const query = toListQuery(input);
        const result = await listCoachPlans(ctx.coachId, query);

        return {
          ok: true as const,
          items: result.items.map((plan) => ({
            id: plan.id,
            name: plan.title,
            weekCount: plan.weekCount,
            createdAt: plan.createdAt,
          })),
          total: result.total,
          hasMore: result.hasMore,
        };
      },
    }),

    get_plan: tool({
      description:
        "Get plan metadata and a compact summary. Never returns full plan JSON.",
      inputSchema: z.object({
        planId: z.string().uuid().describe("Plan id."),
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

        return {
          ok: true as const,
          id: detail.id,
          name: detail.plan.name,
          createdAt: detail.createdAt,
          summary: toPlanToolSummary(detail.plan),
        };
      },
    }),

    list_plan_versions: tool({
      description: "List version history metadata for a plan. No plan_data blobs.",
      inputSchema: z.object({
        planId: z.string().uuid().describe("Plan id."),
      }),
      execute: async ({ planId }) => {
        try {
          const versions = await listCoachPlanVersions(ctx.coachId, planId);

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
    }),

    list_pending_invites: tool({
      description: "List pending athlete link requests for this coach.",
      inputSchema: z.object({}),
      execute: async () => {
        const invites = await listCoachPendingInvites();

        return {
          ok: true as const,
          items: invites.map((invite) => ({
            relationshipId: invite.relationshipId,
            athleteId: invite.athleteId,
            athleteName: invite.athleteName,
            requestedAt: invite.requestedAt,
          })),
        };
      },
    }),
  };
}
