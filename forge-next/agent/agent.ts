import { defineAgent } from "eve";

const model =
  process.env.PLAN_CHAT_MODEL?.trim() || "anthropic/claude-sonnet-4";

export default defineAgent({
  model,
});
