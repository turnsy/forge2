/** Max characters returned from read_session_file (tool output). */
export const SESSION_UPLOAD_READ_MAX_CHARS = 48_000;

/** Max tool-loop steps per user message. */
export const PLAN_CHAT_MAX_TOOL_STEPS = 50;

/** Default Gateway model (tool calling). Override with PLAN_CHAT_MODEL. */
export const PLAN_CHAT_DEFAULT_MODEL = "anthropic/claude-sonnet-4";
