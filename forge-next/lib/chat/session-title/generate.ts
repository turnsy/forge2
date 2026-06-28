import { generateText } from "ai";
import { createSessionTitleGatewayModel } from "@/lib/chat/session-title/gateway";
import { isAiGatewayConfigured } from "@/lib/env/plan-generation";

export const SESSION_FALLBACK_TITLE = "Untitled conversation";

const SESSION_TITLE_MAX_CHARS = 80;
const SESSION_TITLE_MAX_WORDS = 4;

const SESSION_TITLE_SYSTEM = `You label coaching chat threads.
Reply with only a short title (maximum ${SESSION_TITLE_MAX_WORDS} words).
No quotes, labels, or explanation.`;

export type GenerateSessionTitleDeps = {
  generateTextFn?: typeof generateText;
  isGatewayConfigured?: () => boolean;
  createModel?: () => ReturnType<typeof createSessionTitleGatewayModel>;
};

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

export async function generateSessionTitleFromText(
  firstMessage: string,
  deps: GenerateSessionTitleDeps = {},
): Promise<string> {
  const isGatewayConfigured = deps.isGatewayConfigured ?? isAiGatewayConfigured;
  const generateTextFn = deps.generateTextFn ?? generateText;
  const trimmed = firstMessage.trim();

  if (!isGatewayConfigured() || !trimmed) {
    return SESSION_FALLBACK_TITLE;
  }

  try {
    const createModel = deps.createModel ?? createSessionTitleGatewayModel;
    const result = await generateTextFn({
      model: createModel(),
      system: SESSION_TITLE_SYSTEM,
      messages: [{ role: "user", content: trimmed }],
      maxOutputTokens: 16,
      temperature: 0,
    });

    const raw = readGeneratedText(result);
    return normalizeSessionTitle(raw) ?? SESSION_FALLBACK_TITLE;
  } catch {
    return SESSION_FALLBACK_TITLE;
  }
}
