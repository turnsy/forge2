/** Max characters returned from read_draft_file (tool output). */
export const PLAN_CHAT_DRAFT_READ_MAX_CHARS = 48_000;

/** Max tool-loop steps per user message. */
export const PLAN_CHAT_MAX_TOOL_STEPS = 12;

/** Default Gateway model (tool calling). Override with PLAN_CHAT_MODEL. */
export const PLAN_CHAT_DEFAULT_MODEL = "anthropic/claude-sonnet-4";
