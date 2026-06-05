"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { serializePromptDocument } from "@/lib/prompts/prompt-document";
import type { PromptSegment } from "@/lib/prompts/mention-types";
import {
  createDraftId,
  createInitialPlanChatWorkspaceState,
  formatAttachmentDisplayLabel,
  planChatWorkspaceReducer,
  streamPlanChat,
  uploadContextFile,
  validateClientFiles,
} from "@/lib/plan-chat";
import type { PlanChatWorkspaceState } from "@/lib/plan-chat/types";

export function usePlanChatWorkspace() {
  const [state, dispatch] = useReducer(
    planChatWorkspaceReducer,
    undefined,
    createInitialPlanChatWorkspaceState,
  );
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const attachFiles = useCallback(async (files: File[]) => {
    const validation = validateClientFiles(files);
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

      const result = await uploadContextFile({
        draftId: stateRef.current.draftId,
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
  }, []);

  const sendMessage = useCallback(async (segments: PromptSegment[]) => {
    const prompt = serializePromptDocument(segments).trim();
    if (prompt.length === 0) {
      return;
    }

    const snapshot = stateRef.current;
    dispatch({ type: "SEND_START", userMessage: prompt });

    const error = await streamPlanChat({
      body: {
        draftId: snapshot.draftId,
        prompt,
        messages: snapshot.messages,
        currentArtifact: snapshot.currentArtifact,
      },
      onEvent: (event) => {
        dispatch({ type: "APPLY_EVENT", event });
      },
    });

    if (error) {
      dispatch({ type: "STREAM_CLIENT_ERROR", message: error.message });
    }

    dispatch({ type: "STREAM_END" });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "RESTART", draftId: createDraftId() });
  }, []);

  const setPlanTitle = useCallback((planTitle: string) => {
    dispatch({ type: "SET_PLAN_TITLE", planTitle });
  }, []);

  return {
    state,
    attachFiles,
    sendMessage,
    restart,
    setPlanTitle,
  };
}

export type PlanChatWorkspaceController = ReturnType<typeof usePlanChatWorkspace>;

export type { PlanChatWorkspaceState };
