import { getMetadata } from "@/lib/metadata/repository";
import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { listCoachPendingInvites } from "@/lib/links/repository";
import { getCoachId } from "../lib/coach-context";

export default defineTool({
  description: "List pending athlete link requests for this coach.",
  inputSchema: z.object({ includeMetadata: z.boolean().default(false) }),
  async execute(input, ctx) {
    const coachId = getCoachId(ctx);
    const invites = await listCoachPendingInvites();

    return {
      ok: true as const,
      items: await Promise.all(
        invites.map(async (invite) => ({
          ...(input.includeMetadata
            ? { metadata: await getMetadata(coachId, invite.athleteId) }
            : {}),
          relationshipId: invite.relationshipId,
          athleteId: invite.athleteId,
          athleteName: invite.athleteName,
          requestedAt: invite.requestedAt,
        })),
      ),
    };
  },
});
