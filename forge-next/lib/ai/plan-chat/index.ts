/**
 * Plan chat orchestration (Gateway, streaming events, sandbox handoff).
 * Implementation: Phases 3–4.
 *
 * @see docs/plan-generation/phases/phase-3-chat-api.md
 */

export type PlanChatRunStatus =
  | "parsing"
  | "generating"
  | "sandbox"
  | "validating"
  | "done"
  | "error";

export type PlanChatRunStatusEvent = {
  type: "runStatus";
  status: PlanChatRunStatus;
};
