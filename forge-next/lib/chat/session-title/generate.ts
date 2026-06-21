import { generateText, type ModelMessage } from "ai";
import { createPlanChatGatewayModel } from "@/lib/ai/plan-chat/gateway";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import {
  SESSION_FALLBACK_TITLE,
  SESSION_TITLE_MAX_CHARS,
  SESSION_TITLE_PROMPT,
} from "@/lib/chat/session-title/constants";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

export type GenerateSessionTitleDeps = {
  generateTextFn?: typeof generateText;
  isGatewayConfigured?: () => boolean;
  createModel?: () => ReturnType<typeof createPlanChatGatewayModel>;
};

export function countUserMessages(snapshot: ChatSessionSnapshot): number {
  return snapshot.messages.filter((message) => message.role === "user").length;
}

export function formatMessageForTitle(message: ChatMessage): string {
  if (message.segments?.length) {
    return message.segments
      .map((segment) => (segment.type === "text" ? segment.value : segment.label))
      .join("")
      .trim();
  }

  return message.content.trim();
}

export function getFirstUserMessageText(snapshot: ChatSessionSnapshot): string {
  const firstUserMessage = snapshot.messages.find(
    (message) => message.role === "user",
  );

  if (!firstUserMessage) {
    return "";
  }

  return formatMessageForTitle(firstUserMessage);
}

export function buildTitleMessages(snapshot: ChatSessionSnapshot): ModelMessage[] {
  const firstMessage = getFirstUserMessageText(snapshot);
  if (!firstMessage) {
    return [];
  }

  return [{ role: "user", content: firstMessage }];
}

export function normalizeSessionTitle(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.?!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length <= SESSION_TITLE_MAX_CHARS) {
    return cleaned;
  }

  return `${cleaned.slice(0, SESSION_TITLE_MAX_CHARS - 1).trimEnd()}…`;
}

export async function generateSessionTitle(
  snapshot: ChatSessionSnapshot,
  deps: GenerateSessionTitleDeps = {},
): Promise<string> {
  const isGatewayConfigured = deps.isGatewayConfigured ?? isAiGatewayConfigured;
  const generateTextFn = deps.generateTextFn ?? generateText;
  const messages = buildTitleMessages(snapshot);

  if (!isGatewayConfigured() || messages.length === 0) {
    return SESSION_FALLBACK_TITLE;
  }

  try {
    const createModel = deps.createModel ?? createPlanChatGatewayModel;
    const result = await generateTextFn({
      model: createModel(),
      system: SESSION_TITLE_PROMPT,
      messages,
      maxOutputTokens: 32,
      temperature: 0.2,
    });

    return normalizeSessionTitle(result.text) ?? SESSION_FALLBACK_TITLE;
  } catch {
    return SESSION_FALLBACK_TITLE;
  }
}

export async function resolveSessionTitle(
  snapshot: ChatSessionSnapshot,
  existingTitle: string | null | undefined,
  options?: { generateTitle?: boolean },
  deps?: GenerateSessionTitleDeps,
): Promise<string | null> {
  if (existingTitle?.trim()) {
    return existingTitle.trim();
  }

  if (options?.generateTitle !== true) {
    return null;
  }

  if (countUserMessages(snapshot) !== 1) {
    return SESSION_FALLBACK_TITLE;
  }

  return generateSessionTitle(snapshot, deps);
}
