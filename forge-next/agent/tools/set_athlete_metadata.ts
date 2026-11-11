import { z } from "zod";
import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { getCoachId } from "../lib/coach-context";
import { valueSchema } from "@/lib/metadata/input-schema";
import { setMetadata } from "@/lib/metadata/repository";
export default defineTool({
  description:
    "Set/clear explicitly supplied profile answers for a pending or active athlete. Each answer requires the current field version. Null clears an answer; updates retain a change log. Units can be converted for kg/lb and cm/in/m. Never infer missing facts. For an inline human editor call ask_question with metadataEditor:{mode:'athlete',athleteId}. Cancelled chat requests do not authorize additional writes.",
  inputSchema: z.object({
    athleteId: z.string().uuid(),
    answers: z
      .array(
        z.object({
          fieldId: z.string().uuid(),
          version: z.number().int().positive(),
          value: valueSchema,
          unit: z.string().optional(),
        }),
      )
      .max(100),
  }),
  async execute(input, ctx) {
    return {
      ok: true,
      ...(await setMetadata(getCoachId(ctx), input.athleteId, input.answers)),
    };
  },
});
