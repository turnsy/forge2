import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { acceptCoachLink } from "@/lib/links/repository";
import { getCoachId } from "../lib/coach-context";

export default defineTool({
  description:
    "Accept a pending athlete link request. This is a real mutation — confirm intent when ambiguous.",
  inputSchema: z.object({
    relationshipId: z.string().uuid().describe("Pending relationship id."),
  }),
  approval: always(),
  async execute({ relationshipId }, ctx) {
    getCoachId(ctx);
    try {
      await acceptCoachLink(relationshipId);
      return { ok: true as const, relationshipId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept link.";
      return { ok: false as const, message };
    }
  },
});
