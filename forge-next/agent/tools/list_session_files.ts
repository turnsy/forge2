import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachId, getForgeSessionId } from "../lib/coach-context";
import { listForgeSessionUploadPaths } from "../lib/uploads";

export default defineTool({
  description:
    "List storage paths for normalized upload files in this session (one .txt per CSV/PDF or per XLSX sheet).",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const coachId = getCoachId(ctx);
    const forgeSessionId = getForgeSessionId(ctx);
    const paths = await listForgeSessionUploadPaths(coachId, forgeSessionId);
    return { paths };
  },
});
