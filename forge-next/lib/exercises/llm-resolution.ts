import { generateObject } from "ai";
import { z } from "zod";
import { createGateway } from "@ai-sdk/gateway";
import { getAiGatewayApiKey } from "@/lib/env/plan-generation";
import type { ExerciseCandidate } from "./resolve-plan";

const resultSchema = z.object({
  resolutions: z.array(
    z.object({
      raw: z.string(),
      exerciseId: z.string().nullable(),
    }),
  ),
});

export async function resolveAmbiguousExercises(input: {
  values: string[];
  candidates: Record<string, ExerciseCandidate[]>;
  catalog: ExerciseCandidate[];
}): Promise<Map<string, string | null>> {
  if (input.values.length === 0) return new Map();
  const apiKey = getAiGatewayApiKey();
  if (!apiKey) return new Map();
  const model = createGateway({ apiKey })("google/gemini-2.5-flash-lite");
  const { object } = await generateObject({
    model,
    schema: resultSchema,
    temperature: 0,
    system:
      "Resolve exercise names to the best existing catalog id. Use null only when no catalog item matches.",
    prompt: JSON.stringify({
      values: input.values,
      candidates: input.candidates,
      catalog: input.catalog,
    }),
  });
  return new Map(object.resolutions.map((item) => [item.raw, item.exerciseId]));
}
