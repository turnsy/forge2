import { embed, embedMany } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { getAiGatewayApiKey } from "@/lib/env/plan-generation";

export const EXERCISE_EMBEDDING_MODEL = "openai/text-embedding-3-small";

function model() {
  const apiKey = getAiGatewayApiKey();
  if (!apiKey) throw new Error("AI Gateway is not configured");
  return createGateway({ apiKey }).embeddingModel(EXERCISE_EMBEDDING_MODEL);
}

export async function embedExercise(value: string): Promise<number[]> {
  const result = await embed({ model: model(), value });
  return result.embedding;
}

export async function embedExercises(values: string[]): Promise<number[][]> {
  if (values.length === 0) return [];
  const result = await embedMany({ model: model(), values });
  return result.embeddings;
}
