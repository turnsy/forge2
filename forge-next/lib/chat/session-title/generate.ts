import { generateText } from "ai";
import { createSessionTitleGatewayModel } from "@/lib/chat/session-title/gateway";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

export const SESSION_FALLBACK_TITLE = "Untitled conversation";

const SESSION_TITLE_MAX_CHARS = 80;
const SESSION_TITLE_MAX_WORDS = 4;

const SESSION_TITLE_SYSTEM = `You label coaching chat threads.
Reply with only a short title (maximum ${SESSION_TITLE_MAX_WORDS} words).
No quotes, labels, or explanation.`;

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
  createModel?: () => ReturnType<typeof createSessionTitleGatewayModel>;
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

function looksLikeMetaResponse(text: string): boolean {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    wordCount > SESSION_TITLE_MAX_WORDS + 2 ||
    lower.startsWith("we need to") ||
    lower.startsWith("the message") ||
    lower.startsWith("this message") ||
    lower.startsWith("the question") ||
    lower.includes("typical answer") ||
    lower.includes("in 3-4 words") ||
    lower.includes("maximum 4 words")
  );
}

export function normalizeSessionTitle(raw: string): string | null {
  const firstLine = raw.split(/\r?\n/)[0]?.trim() ?? raw.trim();
  const cleaned = firstLine
    .replace(/^title:\s*/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.?!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || looksLikeMetaResponse(cleaned)) {
    return null;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  const trimmed =
    words.length > SESSION_TITLE_MAX_WORDS
      ? words.slice(0, SESSION_TITLE_MAX_WORDS).join(" ")
      : cleaned;

  if (trimmed.length <= SESSION_TITLE_MAX_CHARS) {
    return trimmed;
  }

  return `${trimmed.slice(0, SESSION_TITLE_MAX_CHARS - 1).trimEnd()}…`;
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
    const createModel = deps.createModel ?? createSessionTitleGatewayModel;
    const result = await generateTextFn({
      model: createModel(),
      system: SESSION_TITLE_SYSTEM,
      messages: [{ role: "user", content: firstMessage }],
      maxOutputTokens: 16,
      temperature: 0,
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
