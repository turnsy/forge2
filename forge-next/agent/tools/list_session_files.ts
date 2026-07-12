import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachId, getForgeSessionId } from "../lib/coach-context";
import { listForgeSessionUploadPaths } from "../lib/uploads";

export default defineTool({
  description:
    "List storage paths for coach-attached upload files in this conversation (CSV, PDF, or per-sheet XLSX). Call when the coach asks to build a plan from an attachment or refers to uploaded files.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const coachId = getCoachId(ctx);
    const forgeSessionId = getForgeSessionId(ctx);
    const paths = await listForgeSessionUploadPaths(coachId, forgeSessionId);
    return { paths };
  },
});
