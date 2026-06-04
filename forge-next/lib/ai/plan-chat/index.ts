/**
 * Plan chat orchestration (Gateway, streaming events, sandbox handoff).
 *
 * @see docs/plan-generation/phases/phase-3-chat-api.md
 */

export type {
  PlanChatRunStatus,
  PlanChatRunStatusEvent,
  PlanChatEvent,
  PlanChatRequestBody,
  PlanChatMessage,
} from "@/lib/ai/plan-chat/types";
export { runPlanChat } from "@/lib/ai/plan-chat/orchestrator";
export {
  createPlanChatEventStream,
  encodePlanChatSseEvent,
  PLAN_CHAT_STREAM_HEADERS,
} from "@/lib/ai/plan-chat/events";
export { parsePlanChatRequestBody } from "@/lib/ai/plan-chat/parse-request";
export { summarizePlan } from "@/lib/plans/summarize-plan";
export { buildPlanChatSystemPrompt } from "@/lib/ai/plan-chat/system-prompts";
