import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { getCoachId } from "../lib/coach-context";
import { definitionSchema } from "../lib/metadata-schema";
import { validateDefinition } from "@/lib/metadata/domain";
import { saveField } from "@/lib/metadata/repository";
export default defineTool({
  description:
    "Create a coach-scoped custom athlete profile field. Report missingAthleteCount after creating a required field. No templates. Never invent select options or requiredness. To let the coach edit definitions directly in chat use ask_question with metadataEditor:{mode:'fields'}.",
  inputSchema: definitionSchema,
  async execute(input, ctx) {
    return {
      ok: true,
      ...(await saveField(getCoachId(ctx), validateDefinition(input))),
    };
  },
});
