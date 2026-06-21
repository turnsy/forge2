import { createGateway } from "@ai-sdk/gateway";
import { getAiGatewayApiKey } from "@/lib/env/plan-generation";
import { SESSION_TITLE_DEFAULT_MODEL } from "@/lib/chat/session-title/constants";

export function getSessionTitleModelId(): string {
  const fromEnv = process.env.SESSION_TITLE_MODEL?.trim();
  return fromEnv || SESSION_TITLE_DEFAULT_MODEL;
}

export function createSessionTitleGatewayModel() {
  const apiKey = getAiGatewayApiKey();
  if (!apiKey) {
    throw new Error("AI Gateway is not configured (AI_GATEWAY_API_KEY).");
  }

  const gateway = createGateway({ apiKey });
  return gateway(getSessionTitleModelId());
}
