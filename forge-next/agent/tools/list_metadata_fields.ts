import { z } from "zod";
import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { getCoachId } from "../lib/coach-context";
import { listFields } from "@/lib/metadata/repository";
export default defineTool({
  description:
    "List this coach's athlete profile field definitions, types, units, option IDs, versions, and birth-date semantics. Always fetch before editing/filtering metadata. Field definitions apply to existing and future athletes.",
  inputSchema: z.object({ includeArchived: z.boolean().default(false) }),
  async execute(input, ctx) {
    return {
      ok: true,
      fields: await listFields(getCoachId(ctx), input.includeArchived),
    };
  },
});
