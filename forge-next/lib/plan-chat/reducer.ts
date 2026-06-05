import { applyPlanChatEvent } from "@/lib/plan-chat/apply-plan-chat-event";
import type {
  PlanChatWorkspaceAction,
  PlanChatWorkspaceState,
} from "@/lib/plan-chat/types";

function mergeContextFileIds(
  existing: string[],
  added: string[],
): string[] {
  const seen = new Set(existing);
  const merged = [...existing];
  for (const id of added) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }
  return merged;
}

export function planChatWorkspaceReducer(
  state: PlanChatWorkspaceState,
  action: PlanChatWorkspaceAction,
): PlanChatWorkspaceState {
  switch (action.type) {
    case "RESTART":
      return {
        draftId: action.draftId,
        hasStarted: false,
        messages: [],
        currentArtifact: null,
        contextFileIds: [],
        attachments: [],
        runStatus: null,
        warnings: [],
        errors: [],
        phase: "idle",
        streamingAssistantText: "",
      };
    case "ATTACH_FILES":
      return {
        ...state,
        attachments: [...state.attachments, ...action.attachments],
      };
    case "ATTACH_UPLOAD_START":
      return {
        ...state,
        phase: "uploading",
        attachments: state.attachments.map((attachment) =>
          action.localIds.includes(attachment.localId)
            ? { ...attachment, status: "uploading" as const }
            : attachment,
        ),
      };
    case "ATTACH_UPLOAD_SUCCESS": {
      const attachments = state.attachments.map((attachment) =>
        attachment.localId === action.localId
          ? {
              ...attachment,
              status: "uploaded" as const,
              contextFileIds: action.contextFileIds,
              displayLabel: action.displayLabel,
            }
          : attachment,
      );
      const newIds = action.contextFileIds;
      return {
        ...state,
        attachments,
        contextFileIds: mergeContextFileIds(state.contextFileIds, newIds),
        phase: attachments.some((a) => a.status === "uploading")
          ? "uploading"
          : "idle",
      };
    }
    case "ATTACH_UPLOAD_FAILURE": {
      const attachments = state.attachments.map((attachment) =>
        attachment.localId === action.localId
          ? {
              ...attachment,
              status: "failed" as const,
              errorMessage: action.errorMessage,
            }
          : attachment,
      );
      return {
        ...state,
        attachments,
        phase: attachments.some((a) => a.status === "uploading")
          ? "uploading"
          : "idle",
      };
    }
    case "SEND_START":
      return {
        ...state,
        hasStarted: true,
        phase: "streaming",
        runStatus: null,
        errors: [],
        streamingAssistantText: "",
        messages: [
          ...state.messages,
          { role: "user", content: action.userMessage },
        ],
      };
    case "APPLY_EVENT":
      return applyPlanChatEvent(state, action.event);
    case "STREAM_END": {
      const assistantText = state.streamingAssistantText.trim();
      const messages =
        assistantText.length > 0
          ? [
              ...state.messages,
              { role: "assistant" as const, content: assistantText },
            ]
          : state.messages;

      return {
        ...state,
        messages,
        streamingAssistantText: "",
        phase: state.runStatus === "error" ? "error" : "idle",
      };
    }
    case "STREAM_CLIENT_ERROR":
      return {
        ...state,
        phase: "error",
        errors: [{ message: action.message }],
        runStatus: "error",
      };
    default:
      return state;
  }
}
