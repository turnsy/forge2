import { z } from "zod";
import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { getCoachId } from "../lib/coach-context";
import schema from "@/schemas/athlete-metadata.schema.json";
import { validateDefinition } from "@/lib/metadata/domain";
import { saveField } from "@/lib/metadata/repository";
export default defineTool({
  description:
    "Update/archive a field using its current version and complete definition. Preserve option IDs; retire options rather than removing them. Type/semantic changes and incompatible units with saved answers require a replacement field. Compatible kg/lb and cm/in/m unit changes convert current values atomically and retain historical units; adjust bounds/precision as needed. Report missingAthleteCount for required fields. Old chats are historical; fetch current definitions first.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["id", "version", "definition"],
    properties: {
      id: { type: "string", format: "uuid" },
      version: { type: "integer", minimum: 1 },
      definition: schema,
    },
  },
  async execute(input, ctx) {
    const parsed = z
      .object({
        id: z.string().uuid(),
        version: z.number().int().positive(),
        definition: z.unknown(),
      })
      .parse(input);
    return {
      ok: true,
      ...(await saveField(
        getCoachId(ctx),
        validateDefinition(parsed.definition),
        parsed.id,
        parsed.version,
      )),
    };
  },
});
