import { createGateway } from "@ai-sdk/gateway";
import { getAiGatewayApiKey } from "@/lib/env/plan-generation";
import { PLAN_CHAT_DEFAULT_MODEL } from "@/lib/ai/plan-chat/constants";

export function getPlanChatModelId(): string {
  const fromEnv = process.env.PLAN_CHAT_MODEL?.trim();
  return fromEnv || PLAN_CHAT_DEFAULT_MODEL;
}

export function createPlanChatGatewayModel() {
  const apiKey = getAiGatewayApiKey();
  if (!apiKey) {
    throw new Error("AI Gateway is not configured (AI_GATEWAY_API_KEY).");
  }

  const gateway = createGateway({ apiKey });
  return gateway(getPlanChatModelId());
}
