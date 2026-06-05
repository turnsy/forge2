import type { PlanChatEvent } from "@/lib/ai/plan-chat/types";
import type { PlanChatWorkspaceState } from "@/lib/plan-chat/types";

export function applyPlanChatEvent(
  state: PlanChatWorkspaceState,
  event: PlanChatEvent,
): PlanChatWorkspaceState {
  switch (event.type) {
    case "assistantTextDelta":
      return {
        ...state,
        streamingAssistantText: state.streamingAssistantText + event.delta,
      };
    case "runStatus":
      return {
        ...state,
        runStatus: event.status,
        phase: event.status === "error" ? "error" : state.phase,
      };
    case "artifact":
      return {
        ...state,
        currentArtifact: event.plan,
      };
    case "warnings":
      return {
        ...state,
        warnings: [...state.warnings, ...event.warnings],
      };
    case "errors":
      return {
        ...state,
        errors: event.errors.map((entry) =>
          "path" in entry
            ? { path: entry.path, message: entry.message }
            : { code: entry.code, message: entry.message },
        ),
        phase: "error",
      };
    default:
      return state;
  }
}
