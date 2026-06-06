"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { serializePromptDocument } from "@/lib/prompts/prompt-document";
import type { PromptSegment } from "@/lib/prompts/mentions/types";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import { createSessionId, formatAttachmentDisplayLabel } from "@/lib/chat/utils";
import type { ChatEvent, ChatMessage, ChatWorkspaceState } from "@/lib/chat/types";

export type ChatStreamError = { message: string };

export type UseChatWorkspaceConfig<TArtifact> = {
  streamChat: (input: {
    sessionId: string;
    prompt: string;
    messages: ChatMessage[];
    currentArtifact: TArtifact | null;
    onEvent: (event: ChatEvent<TArtifact>) => void;
  }) => Promise<ChatStreamError | null>;
  uploadFile: (input: {
    sessionId: string;
    file: File;
  }) => Promise<
    | { ok: true; contextFileIds: string[] }
    | { ok: false; message: string }
  >;
  validateFiles?: (
    files: File[],
  ) => { ok: true } | { ok: false; message: string };
};

export function useChatWorkspace<TArtifact>(
  config: UseChatWorkspaceConfig<TArtifact>,
) {
  const [state, dispatch] = useReducer(
    chatWorkspaceReducer<TArtifact>,
    undefined,
    () => createInitialChatWorkspaceState<TArtifact>(),
  );
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const attachFiles = useCallback(
    async (files: File[]) => {
      const validation = config.validateFiles?.(files) ?? { ok: true as const };
      if (!validation.ok) {
        dispatch({
          type: "STREAM_CLIENT_ERROR",
          message: validation.message,
        });
        return;
      }

      const attachments = files.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        status: "pending" as const,
        displayLabel: file.name,
      }));

      dispatch({ type: "ATTACH_FILES", attachments });

      for (const attachment of attachments) {
        dispatch({
          type: "ATTACH_UPLOAD_START",
          localIds: [attachment.localId],
        });

        const result = await config.uploadFile({
          sessionId: stateRef.current.sessionId,
          file: attachment.file,
        });

        if (!result.ok) {
          dispatch({
            type: "ATTACH_UPLOAD_FAILURE",
            localId: attachment.localId,
            errorMessage: result.message,
          });
          continue;
        }

        dispatch({
          type: "ATTACH_UPLOAD_SUCCESS",
          localId: attachment.localId,
          contextFileIds: result.contextFileIds,
          displayLabel: formatAttachmentDisplayLabel(
            attachment.file.name,
            result.contextFileIds.length,
          ),
        });
      }
    },
    [config],
  );

  const sendMessage = useCallback(
    async (segments: PromptSegment[]) => {
      const prompt = serializePromptDocument(segments).trim();
      if (prompt.length === 0) {
        return;
      }

      const snapshot = stateRef.current;
      dispatch({ type: "SEND_START", userMessage: prompt });

      const error = await config.streamChat({
        sessionId: snapshot.sessionId,
        prompt,
        messages: snapshot.messages,
        currentArtifact: snapshot.currentArtifact,
        onEvent: (event) => {
          dispatch({ type: "APPLY_EVENT", event });
        },
      });

      if (error) {
        dispatch({ type: "STREAM_CLIENT_ERROR", message: error.message });
      }

      dispatch({ type: "STREAM_END" });
    },
    [config],
  );

  const restart = useCallback(() => {
    dispatch({ type: "RESTART", sessionId: createSessionId() });
  }, []);

  const setArtifactTitle = useCallback((artifactTitle: string) => {
    dispatch({ type: "SET_ARTIFACT_TITLE", artifactTitle });
  }, []);

  return {
    state,
    attachFiles,
    sendMessage,
    restart,
    setArtifactTitle,
  };
}

export type ChatWorkspaceController<TArtifact> = ReturnType<
  typeof useChatWorkspace<TArtifact>
>;

export type { ChatWorkspaceState };
