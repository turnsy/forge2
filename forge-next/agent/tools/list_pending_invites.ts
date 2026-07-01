import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { listCoachPendingInvites } from "@/lib/links/repository";
import { getCoachId } from "../lib/coach-context";

export default defineTool({
  description: "List pending athlete link requests for this coach.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    getCoachId(ctx);
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
});
