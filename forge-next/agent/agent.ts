import { defineAgent } from "eve";

const model =
  process.env.PLAN_CHAT_MODEL?.trim() || "openai/gpt-6.1-sol";

export default defineAgent({
  model,
  // Gateway /v1/models lists this limit, but Eve's catalog lookup lags behind.
  modelContextWindowTokens:
    model === "openai/gpt-6.1-sol" ? 1_050_000 : undefined,
});
