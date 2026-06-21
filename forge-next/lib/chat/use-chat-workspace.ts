"use client";

import { useCallback, useEffect, useReducer, useRef, type Dispatch } from "react";
import {
  serializePromptDocument,
  serializePromptForAgent,
} from "@/lib/prompts/prompt-document";
import type { PromptSegment } from "@/lib/prompts/mentions/types";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import { createSessionId, formatAttachmentDisplayLabel } from "@/lib/chat/utils";
import type {
  ChatEvent,
  ChatMessage,
  ChatWorkspaceAction,
  ChatWorkspaceState,
} from "@/lib/chat/types";

export type ChatStreamError = { message: string };

export type ChatSnapshotSaveResult = {
  sessionTitle: string | null;
};

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
  onSaveSnapshot?: (
    state: ChatWorkspaceState<TArtifact>,
  ) => Promise<ChatSnapshotSaveResult | void> | ChatSnapshotSaveResult | void;
};

export type UseChatWorkspaceOptions<TArtifact> = {
  initialState?: ChatWorkspaceState<TArtifact>;
};

export function useChatWorkspace<TArtifact>(
  config: UseChatWorkspaceConfig<TArtifact>,
  options: UseChatWorkspaceOptions<TArtifact> = {},
) {
  const [state, baseDispatch] = useReducer(
    chatWorkspaceReducer<TArtifact>,
    undefined,
    () => options.initialState ?? createInitialChatWorkspaceState<TArtifact>(),
  );
  const stateRef = useRef(state);
  const dispatch = useCallback<Dispatch<ChatWorkspaceAction<TArtifact>>>(
    (action) => {
      stateRef.current = chatWorkspaceReducer(stateRef.current, action);
      baseDispatch(action);
    },
    [],
  );
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
    [config, dispatch],
  );

  const sendMessage = useCallback(
    async (segments: PromptSegment[]) => {
      const displayPrompt = serializePromptDocument(segments).trim();
      const agentPrompt = serializePromptForAgent(segments).trim();
      if (displayPrompt.length === 0) {
        return;
      }

      const snapshot = stateRef.current;
      dispatch({
        type: "SEND_START",
        userMessage: displayPrompt,
        userSegments: segments,
      });

      const error = await config.streamChat({
        sessionId: snapshot.sessionId,
        prompt: agentPrompt,
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
      const saveResult = await config.onSaveSnapshot?.(stateRef.current);
      if (
        saveResult?.sessionTitle != null &&
        stateRef.current.sessionTitle == null
      ) {
        dispatch({
          type: "SET_SESSION_TITLE",
          sessionTitle: saveResult.sessionTitle,
        });
      }
    },
    [config, dispatch],
  );

  const restart = useCallback(() => {
    dispatch({ type: "RESTART", sessionId: createSessionId() });
  }, [dispatch]);

  const setArtifactTitle = useCallback((artifactTitle: string) => {
    dispatch({ type: "SET_ARTIFACT_TITLE", artifactTitle });
  }, [dispatch]);

  const setPlanId = useCallback((planId: string) => {
    dispatch({ type: "SET_PLAN_ID", planId });
  }, [dispatch]);

  const setArtifact = useCallback((artifact: TArtifact) => {
    dispatch({ type: "SET_ARTIFACT", artifact });
  }, [dispatch]);

  return {
    state,
    attachFiles,
    sendMessage,
    restart,
    setArtifactTitle,
    setPlanId,
    setArtifact,
  };
}

export type ChatWorkspaceController<TArtifact> = ReturnType<
  typeof useChatWorkspace<TArtifact>
>;

export type { ChatWorkspaceState };
