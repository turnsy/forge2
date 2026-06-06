import type { ChatEvent, ChatWorkspaceState } from "@/lib/chat/types";

export function applyChatEvent<TArtifact>(
  state: ChatWorkspaceState<TArtifact>,
  event: ChatEvent<TArtifact>,
): ChatWorkspaceState<TArtifact> {
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
        currentArtifact: event.artifact,
        artifactTitle: event.title ?? state.artifactTitle,
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
