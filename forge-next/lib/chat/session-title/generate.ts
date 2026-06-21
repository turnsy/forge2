import { generateText } from "ai";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import { createSessionTitleGatewayModel } from "@/lib/chat/session-title/gateway";
import {
  SESSION_TITLE_MAX_CHARS,
  SESSION_TITLE_PROMPT,
} from "@/lib/chat/session-title/constants";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

const PREVIEW_FALLBACK_MAX_LENGTH = 60;

export type GenerateSessionTitleDeps = {
  generateTextFn?: typeof generateText;
  isGatewayConfigured?: () => boolean;
  createModel?: () => ReturnType<typeof createSessionTitleGatewayModel>;
};

export function hasAssistantReply(snapshot: ChatSessionSnapshot): boolean {
  return snapshot.messages.some((message) => message.role === "assistant");
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

export function formatConversationForTitle(snapshot: ChatSessionSnapshot): string {
  const lines = snapshot.messages
    .slice(0, 6)
    .map((message) => {
      const label = message.role === "user" ? "Coach" : "Assistant";
      return `${label}: ${formatMessageForTitle(message)}`;
    })
    .filter((line) => line.length > "Coach: ".length);

  if (snapshot.artifactTitle.trim()) {
    lines.push(`Plan title: ${snapshot.artifactTitle.trim()}`);
  }

  return lines.join("\n");
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

export function deriveFallbackSessionTitle(snapshot: ChatSessionSnapshot): string {
  const artifactTitle = snapshot.artifactTitle.trim();
  if (artifactTitle) {
    return artifactTitle;
  }

  const firstUserMessage = snapshot.messages.find(
    (message) => message.role === "user",
  );
  if (firstUserMessage) {
    const content = formatMessageForTitle(firstUserMessage);
    if (content.length <= PREVIEW_FALLBACK_MAX_LENGTH) {
      return content;
    }

    return `${content.slice(0, PREVIEW_FALLBACK_MAX_LENGTH - 1).trimEnd()}…`;
  }

  return "Untitled conversation";
}

export async function generateSessionTitle(
  snapshot: ChatSessionSnapshot,
  deps: GenerateSessionTitleDeps = {},
): Promise<string> {
  const isGatewayConfigured = deps.isGatewayConfigured ?? isAiGatewayConfigured;
  const generateTextFn = deps.generateTextFn ?? generateText;

  if (!isGatewayConfigured()) {
    return deriveFallbackSessionTitle(snapshot);
  }

  try {
    const createModel = deps.createModel ?? createSessionTitleGatewayModel;
    const conversation = formatConversationForTitle(snapshot);
    const result = await generateTextFn({
      model: createModel(),
      system: SESSION_TITLE_PROMPT,
      prompt: conversation,
      maxOutputTokens: 32,
      temperature: 0.2,
    });

    return (
      normalizeSessionTitle(result.text) ?? deriveFallbackSessionTitle(snapshot)
    );
  } catch {
    return deriveFallbackSessionTitle(snapshot);
  }
}

export async function resolveSessionTitle(
  snapshot: ChatSessionSnapshot,
  existingTitle: string | null | undefined,
  options?: { generateTitle?: boolean },
): Promise<string> {
  const preserved = snapshot.title?.trim() || existingTitle?.trim();
  if (preserved) {
    return preserved;
  }

  if (options?.generateTitle === false || !hasAssistantReply(snapshot)) {
    return deriveFallbackSessionTitle(snapshot);
  }

  return generateSessionTitle(snapshot);
}
