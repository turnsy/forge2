import { generateText } from "ai";
import { createPlanChatGatewayModel } from "@/lib/ai/plan-chat/gateway";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

export const SESSION_FALLBACK_TITLE = "Untitled conversation";

const SESSION_TITLE_MAX_CHARS = 80;

export type GenerateSessionTitleDeps = {
  generateTextFn?: typeof generateText;
  isGatewayConfigured?: () => boolean;
  createModel?: () => ReturnType<typeof createPlanChatGatewayModel>;
};

function countUserMessages(snapshot: ChatSessionSnapshot): number {
  return snapshot.messages.filter((message) => message.role === "user").length;
}

function formatMessageForTitle(message: ChatMessage): string {
  if (message.segments?.length) {
    return message.segments
      .map((segment) => (segment.type === "text" ? segment.value : segment.label))
      .join("")
      .trim();
  }

  return message.content.trim();
}

function getFirstUserMessageText(snapshot: ChatSessionSnapshot): string {
  const firstUserMessage = snapshot.messages.find(
    (message) => message.role === "user",
  );

  if (!firstUserMessage) {
    return "";
  }

  return formatMessageForTitle(firstUserMessage);
}

export function buildSessionTitlePrompt(firstMessage: string): string {
  return `Summarize the following in 3-4 words: ${firstMessage}`;
}

function normalizeSessionTitle(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.?!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return null;
  }

  const lower = cleaned.toLowerCase();
  if (
    lower.startsWith("summarize") ||
    lower.includes("3-4 words") ||
    lower.includes("the following")
  ) {
    return null;
  }

  if (cleaned.length <= SESSION_TITLE_MAX_CHARS) {
    return cleaned;
  }

  return `${cleaned.slice(0, SESSION_TITLE_MAX_CHARS - 1).trimEnd()}…`;
}

export function shouldGenerateSessionTitle(
  snapshot: ChatSessionSnapshot,
  options?: { generateTitle?: boolean },
): boolean {
  return options?.generateTitle === true && countUserMessages(snapshot) === 1;
}

export async function generateSessionTitle(
  snapshot: ChatSessionSnapshot,
  deps: GenerateSessionTitleDeps = {},
): Promise<string> {
  const isGatewayConfigured = deps.isGatewayConfigured ?? isAiGatewayConfigured;
  const generateTextFn = deps.generateTextFn ?? generateText;
  const firstMessage = getFirstUserMessageText(snapshot);

  if (!isGatewayConfigured() || !firstMessage) {
    return SESSION_FALLBACK_TITLE;
  }

  try {
    const createModel = deps.createModel ?? createPlanChatGatewayModel;
    const result = await generateTextFn({
      model: createModel(),
      prompt: buildSessionTitlePrompt(firstMessage),
      maxOutputTokens: 24,
      temperature: 0.2,
    });

    return normalizeSessionTitle(result.text) ?? SESSION_FALLBACK_TITLE;
  } catch {
    return SESSION_FALLBACK_TITLE;
  }
}
