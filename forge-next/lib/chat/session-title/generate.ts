import { generateText } from "ai";
import { createPlanChatGatewayModel } from "@/lib/ai/plan-chat/gateway";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

export const SESSION_FALLBACK_TITLE = "Untitled conversation";

const SESSION_TITLE_MAX_CHARS = 80;

export type SessionTitleFailureReason =
  | "gateway_unconfigured"
  | "empty_first_message"
  | "api_error"
  | "empty_model_output"
  | "invalid_model_output";

export type SessionTitleGenerationResult =
  | { ok: true; title: string }
  | { ok: false; reason: SessionTitleFailureReason; detail?: string };

export type GenerateSessionTitleDeps = {
  generateTextFn?: typeof generateText;
  isGatewayConfigured?: () => boolean;
  createModel?: () => ReturnType<typeof createPlanChatGatewayModel>;
  onFailure?: (result: Extract<SessionTitleGenerationResult, { ok: false }>) => void;
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

function readGeneratedText(result: Awaited<ReturnType<typeof generateText>>): string {
  const direct = result.text.trim();
  if (direct) {
    return direct;
  }

  return result.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();
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

export async function generateSessionTitleWithResult(
  snapshot: ChatSessionSnapshot,
  deps: GenerateSessionTitleDeps = {},
): Promise<SessionTitleGenerationResult> {
  const isGatewayConfigured = deps.isGatewayConfigured ?? isAiGatewayConfigured;
  const generateTextFn = deps.generateTextFn ?? generateText;
  const firstMessage = getFirstUserMessageText(snapshot);

  if (!isGatewayConfigured()) {
    return { ok: false, reason: "gateway_unconfigured" };
  }

  if (!firstMessage) {
    return { ok: false, reason: "empty_first_message" };
  }

  try {
    const createModel = deps.createModel ?? createPlanChatGatewayModel;
    const result = await generateTextFn({
      model: createModel(),
      messages: [
        {
          role: "user",
          content: buildSessionTitlePrompt(firstMessage),
        },
      ],
      maxOutputTokens: 32,
      temperature: 0.2,
    });

    const raw = readGeneratedText(result);
    if (!raw) {
      return { ok: false, reason: "empty_model_output" };
    }

    const title = normalizeSessionTitle(raw);
    if (!title) {
      return {
        ok: false,
        reason: "invalid_model_output",
        detail: raw,
      };
    }

    return { ok: true, title };
  } catch (error) {
    return {
      ok: false,
      reason: "api_error",
      detail: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function generateSessionTitle(
  snapshot: ChatSessionSnapshot,
  deps: GenerateSessionTitleDeps = {},
): Promise<string> {
  const result = await generateSessionTitleWithResult(snapshot, deps);

  if (result.ok) {
    return result.title;
  }

  deps.onFailure?.(result);

  if (process.env.NODE_ENV === "development") {
    console.warn("[session-title] falling back to untitled", result);
  }

  return SESSION_FALLBACK_TITLE;
}
