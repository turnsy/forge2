import { createGateway } from "@ai-sdk/gateway";
import { getAiGatewayApiKey } from "@/lib/env/plan-generation";

/** Fast model for one-shot titles. Override with SESSION_TITLE_MODEL. */
export const SESSION_TITLE_DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

export function createSessionTitleGatewayModel() {
  const apiKey = getAiGatewayApiKey();
  if (!apiKey) {
    throw new Error("AI Gateway is not configured (AI_GATEWAY_API_KEY).");
  }

  const modelId =
    process.env.SESSION_TITLE_MODEL?.trim() || SESSION_TITLE_DEFAULT_MODEL;
  const gateway = createGateway({ apiKey });
  return gateway(modelId);
}
