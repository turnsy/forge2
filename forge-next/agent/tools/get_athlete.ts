import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { getCoachId } from "../lib/coach-context";
import { toToolNotFound } from "../lib/db-tool-errors";

export default defineTool({
  description:
    "Get one athlete's relationship and current assignment metadata. Does not return workout content.",
  inputSchema: z.object({
    athleteId: z.string().uuid().describe("Athlete profile id."),
  }),
  async execute({ athleteId }, ctx) {
    getCoachId(ctx);
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
});
