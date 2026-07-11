import { applyChatEvent } from "@/lib/chat/apply-chat-event";
import {
  STREAM_INTERRUPTED_MESSAGE,
  wasChatRunInterrupted,
} from "@/lib/chat/stream-completion";
import type { ChatWorkspaceAction, ChatWorkspaceState } from "@/lib/chat/types";

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

export function chatWorkspaceReducer<TArtifact>(
  state: ChatWorkspaceState<TArtifact>,
  action: ChatWorkspaceAction<TArtifact>,
): ChatWorkspaceState<TArtifact> {
  switch (action.type) {
    case "RESTART":
      return {
        sessionId: action.sessionId,
        hasStarted: false,
        messages: [],
        planId: null,
        currentArtifact: null,
        contextFileIds: [],
        attachments: [],
        runStatus: null,
        warnings: [],
        errors: [],
        phase: "idle",
        streamingAssistantText: "",
        artifactTitle: "",
        sessionTitle: null,
      };
    case "SET_SESSION_TITLE":
      return { ...state, sessionTitle: action.sessionTitle };
    case "SET_ARTIFACT_TITLE":
      return { ...state, artifactTitle: action.artifactTitle };
    case "SET_PLAN_ID":
      return { ...state, planId: action.planId };
    case "SET_ARTIFACT":
      return { ...state, currentArtifact: action.artifact };
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
      const target = state.attachments.find(
        (attachment) => attachment.localId === action.localId,
      );
      if (!target) {
        return {
          ...state,
          phase: state.attachments.some((a) => a.status === "uploading")
            ? "uploading"
            : "idle",
        };
      }

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
    case "RESTORE_ATTACHMENTS": {
      const existingIds = new Set(state.contextFileIds);
      const restored = action.attachments.filter((attachment) =>
        (attachment.contextFileIds ?? []).some((id) => !existingIds.has(id)),
      );
      if (restored.length === 0) {
        return state;
      }

      const restoredIds = restored.flatMap(
        (attachment) => attachment.contextFileIds ?? [],
      );

      return {
        ...state,
        attachments: [...state.attachments, ...restored],
        contextFileIds: mergeContextFileIds(state.contextFileIds, restoredIds),
      };
    }
    case "SYNC_ATTACHMENTS": {
      const syncedIds = action.attachments.flatMap(
        (attachment) => attachment.contextFileIds ?? [],
      );
      const inFlight = state.attachments.filter(
        (attachment) =>
          attachment.status === "pending" || attachment.status === "uploading",
      );
      const inFlightIds = inFlight.flatMap(
        (attachment) => attachment.contextFileIds ?? [],
      );

      return {
        ...state,
        attachments: [...inFlight, ...action.attachments],
        contextFileIds: mergeContextFileIds(syncedIds, inFlightIds),
        phase: inFlight.some((item) => item.status === "uploading")
          ? "uploading"
          : "idle",
      };
    }
    case "REMOVE_ATTACHMENT": {
      const attachment = state.attachments.find(
        (item) => item.localId === action.localId,
      );
      if (!attachment) {
        return state;
      }

      const removedIds = new Set(attachment.contextFileIds ?? []);
      const attachments = state.attachments.filter(
        (item) => item.localId !== action.localId,
      );

      return {
        ...state,
        attachments,
        contextFileIds: state.contextFileIds.filter((id) => !removedIds.has(id)),
        phase: attachments.some((item) => item.status === "uploading")
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
          {
            role: "user",
            content: action.userMessage,
            ...(action.userSegments?.some((segment) => segment.type === "mention")
              ? { segments: action.userSegments }
              : {}),
          },
        ],
      };
    case "APPLY_EVENT":
      return applyChatEvent(state, action.event);
    case "STREAM_END": {
      const assistantText = state.streamingAssistantText.trim();
      const messages =
        assistantText.length > 0
          ? [
              ...state.messages,
              { role: "assistant" as const, content: assistantText },
            ]
          : state.messages;

      if (wasChatRunInterrupted(state.runStatus)) {
        return {
          ...state,
          messages,
          streamingAssistantText: "",
          phase: "error",
          runStatus: "error",
          errors:
            state.errors.length > 0
              ? state.errors
              : [
                  ...state.errors,
                  {
                    code: "STREAM_INTERRUPTED",
                    message: STREAM_INTERRUPTED_MESSAGE,
                  },
                ],
        };
      }

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
