import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { coachArtifact } from "../lib/coach-artifact-state";

export default defineTool({
  description: "Show the current plan preview to the user. Loading or updating a plan does not open the preview. Call when you want to show what you have done, or the user asks to see the plan. Hiding the preview does not clear the current plan.",
  inputSchema: z.object({}),
  async execute() {
    return coachArtifact.get().plan
      ? { ok: true as const }
      : { ok: false as const, message: "No current plan to show." };
  },
});
