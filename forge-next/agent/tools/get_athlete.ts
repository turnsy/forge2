import { getMetadata, metadataHistory } from "@/lib/metadata/repository";
import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { getCoachId } from "../lib/coach-context";
import { toToolNotFound } from "../lib/db-tool-errors";

export default defineTool({
  description:
    "Get one athlete's pending/active relationship and current assignment. Optionally include current profile field definitions, answers, missing required fields, and up to 50 history events (use historyBefore for older events). Does not return workout content.",
  inputSchema: z.object({
    includeMetadata: z.boolean().default(false),
    includeHistory: z.boolean().default(false),
    historyBefore: z.number().int().positive().optional(),
    athleteId: z.string().uuid().describe("Athlete profile id."),
  }),
  async execute(
    { athleteId, includeMetadata, includeHistory, historyBefore },
    ctx,
  ) {
    const coachId = getCoachId(ctx);
    const relationship = await getCoachAthleteRelationship(athleteId);

    if (!relationship) {
      return toToolNotFound("Athlete");
    }

    return {
      ...(includeMetadata
        ? { metadata: await getMetadata(coachId, athleteId) }
        : {}),
      ...(includeHistory
        ? { history: await metadataHistory(coachId, athleteId, historyBefore) }
        : {}),
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
});
