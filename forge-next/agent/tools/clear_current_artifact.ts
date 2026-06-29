import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { clearCoachArtifact } from "../lib/coach-artifact-state";
import { getCoachId } from "../lib/coach-context";
import type { ClearCurrentArtifactOutput } from "@/lib/chat/adapters/plan/forge-tool-outputs";

export default defineTool({
  description:
    "Clear the current plan artifact so a brand-new plan can be created from scratch. Use only when the user explicitly asks for a new plan — not when iterating on the current plan.",
  inputSchema: z.object({}),
  async execute(_input, ctx): Promise<ClearCurrentArtifactOutput> {
    getCoachId(ctx);
    clearCoachArtifact();
    return {
      ok: true as const,
      message: "Current plan cleared. Ready for a new plan.",
    };
  },
});
