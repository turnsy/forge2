import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachId, getForgeSessionId } from "../lib/coach-context";
import { readForgeSessionUpload } from "../lib/uploads";

export default defineTool({
  description:
    "Read an image directly or normalized text for one attached file path from list_session_files. Call before submit_plan_code when building or updating a plan from an upload.",
  inputSchema: z.object({
    path: z.string().min(1).describe("Storage object path."),
  }),
  async execute({ path }, ctx) {
    const coachId = getCoachId(ctx);
    const sessionId = getForgeSessionId(ctx);
    if (!path.startsWith(`${coachId}/${sessionId}/`)) return { ok: false as const, error: "FILE_NOT_FOUND" as const };
    return readForgeSessionUpload(coachId, path);
  },
});
