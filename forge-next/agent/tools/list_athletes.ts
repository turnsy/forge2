import { z } from "zod";
import { filterSchema } from "@/lib/metadata/filters";
import { listMetadataAthletes } from "@/lib/metadata/repository";
import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { getCoachId } from "../lib/coach-context";
import { listInputSchema, toListQuery } from "../lib/list-schema";

export default defineTool({
  description:
    "List linked athletes for this coach. Supports optional name search via q, metadata filters (AND), and metadata inclusion. Fetch list_metadata_fields to resolve field/option IDs. age_between uses birth date, inclusive bounds, today by default. Missing values never match ordinary filters. Read every page before bulk assignment; use explicit athlete IDs.",
  inputSchema: listInputSchema.extend({
    filters: z.array(filterSchema).max(30).optional(),
    includeMetadata: z.boolean().optional(),
    incomplete: z.boolean().optional(),
  }),
  async execute(input, ctx) {
    const coachId = getCoachId(ctx);
    if (input.filters?.length || input.includeMetadata || input.incomplete) {
      const result = await listMetadataAthletes(coachId, input);
      return {
        ok: true,
        ...result,
        items: result.items.map((a) => ({
          id: a.id,
          name: a.name,
          currentPlanId: a.currentPlanId,
          currentPlanName: a.currentPlanName,
          joinedAt: a.linked_at,
          missingMetadataFieldIds: a.missing,
          ...(input.includeMetadata ? { metadata: a.metadata } : {}),
        })),
      };
    }
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
});
