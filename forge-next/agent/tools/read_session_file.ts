import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachId } from "../lib/coach-context";
import { readForgeSessionUpload } from "../lib/uploads";

export default defineTool({
  description:
    "Read normalized upload text for one path from list_session_files.",
  inputSchema: z.object({
    path: z.string().min(1).describe("Storage object path."),
  }),
  async execute({ path }, ctx) {
    const coachId = getCoachId(ctx);
    return readForgeSessionUpload(coachId, path);
  },
});
