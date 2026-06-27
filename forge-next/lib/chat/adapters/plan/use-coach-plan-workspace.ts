"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useEveAgent } from "eve/react";
import { saveSessionSnapshot } from "@/lib/chat/actions";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import { uploadContextFile } from "@/lib/chat/adapters/plan/upload-context-client";
import { validateClientFiles } from "@/lib/chat/adapters/plan/validate-client-files";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import {
  buildCoachWorkspaceSnapshot,
  normalizeCoachWorkspaceSnapshot,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";
import { getSnapshotMessages, snapshotHasConversation } from "@/lib/chat/snapshot-messages";
import { createSessionId, formatAttachmentDisplayLabel } from "@/lib/chat/utils";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import type { ChatWorkspaceAction, ChatWorkspaceState } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import type { PromptSegment } from "@/lib/prompts/mentions/types";
import {
  serializePromptDocument,
  serializePromptForAgent,
} from "@/lib/prompts/prompt-document";

type AttachmentState = Pick<
  ChatWorkspaceState<WorkoutPlan>,
  "attachments" | "contextFileIds" | "phase"
>;

function createAttachmentState(): AttachmentState {
  return {
    attachments: [],
    contextFileIds: [],
    phase: "idle",
  };
}

function attachmentReducer(
  state: AttachmentState,
  action: ChatWorkspaceAction<WorkoutPlan>,
): AttachmentState {
  const workspace = chatWorkspaceReducer(
    {
      ...createInitialChatWorkspaceState<WorkoutPlan>(),
      ...state,
      sessionId: "",
      hasStarted: false,
      sessionTitle: null,
      artifactTitle: "",
      planId: null,
      messages: [],
      currentArtifact: null,
      runStatus: null,
      warnings: [],
      errors: [],
      streamingAssistantText: "",
    },
    action,
  );

  return {
    attachments: workspace.attachments,
    contextFileIds: workspace.contextFileIds,
    phase: workspace.phase,
  };
}

export function useCoachPlanWorkspace(options?: {
  initialPlan?: WorkoutPlan;
  planId?: string;
  initialSession?: { id: string; snapshot: CoachWorkspaceSnapshot };
  onArtifactCleared?: () => void;
  onSessionPersisted?: (sessionId: string) => void;
}) {
  const initialPlan = options?.initialPlan;
  const planId = options?.planId;
  const initialSession = options?.initialSession;
  const onArtifactCleared = options?.onArtifactCleared;
  const onSessionPersisted = options?.onSessionPersisted;
  const hasSyncedSessionUrlRef = useRef(false);

  const normalizedSnapshot = useMemo(() => {
    if (!initialSession) {
      return null;
    }

    return normalizeCoachWorkspaceSnapshot(
      initialSession.id,
      initialSession.snapshot,
    );
  }, [initialSession]);

  const [forgeSessionId] = useState(() => {
    if (initialSession?.id) {
      return initialSession.id;
    }
    return createSessionId();
  });

  const eveReducer = useMemo(
    () =>
      createEveCoachReducer({
        messages: normalizedSnapshot
          ? getSnapshotMessages(normalizedSnapshot)
          : [],
        currentArtifact:
          normalizedSnapshot?.ui.currentArtifact ??
          initialPlan ??
          null,
        planId: normalizedSnapshot?.ui.planId ?? planId ?? null,
        artifactTitle:
          normalizedSnapshot?.ui.artifactTitle ??
          initialPlan?.name ??
          "",
      }),
    [normalizedSnapshot, initialPlan, planId],
  );

  const sessionTitleRef = useRef<string | null>(
    normalizedSnapshot?.title ?? null,
  );

  const agent = useEveAgent({
    reducer: eveReducer,
    initialSession: normalizedSnapshot?.eve
      ? {
          sessionId: normalizedSnapshot.eve.sessionId,
          continuationToken: normalizedSnapshot.eve.continuationToken,
          streamIndex: normalizedSnapshot.eve.streamIndex,
        }
      : undefined,
    initialEvents: normalizedSnapshot?.eve?.events,
    headers: () => ({
      [FORGE_SESSION_HEADER]: forgeSessionId,
    }),
    prepareSend: (input) => ({
      ...input,
      clientContext: {
        forgeSessionId,
      },
    }),
    onFinish: async (snapshot) => {
      const hasConversation =
        snapshot.data.messages.length > 0 ||
        snapshot.events.length > 0;

      if (!hasConversation) {
        return;
      }

      const workspaceSnapshot = buildCoachWorkspaceSnapshot({
        forgeSessionId,
        title: sessionTitleRef.current,
        ui: {
          planId: snapshot.data.planId,
          artifactTitle: snapshot.data.artifactTitle,
          currentArtifact: snapshot.data.currentArtifact,
        },
        eve: snapshot.session.sessionId
          ? {
              sessionId: snapshot.session.sessionId,
              continuationToken: snapshot.session.continuationToken ?? "",
              streamIndex: snapshot.session.streamIndex,
              events: [...snapshot.events],
            }
          : null,
      });

      const result = await saveSessionSnapshot(
        forgeSessionId,
        workspaceSnapshot,
      );

      if (!result.ok) {
        return;
      }

      if (!hasSyncedSessionUrlRef.current && onSessionPersisted) {
        hasSyncedSessionUrlRef.current = true;
        onSessionPersisted(forgeSessionId);
      }

      if (result.title != null) {
        sessionTitleRef.current = result.title;
      }
    },
  });

  const [attachmentState, dispatchAttachments] = useReducer(
    attachmentReducer,
    createAttachmentState(),
  );

  const isBusy =
    agent.status === "submitted" || agent.status === "streaming";

  const phase: PlanWorkspaceState["phase"] =
    attachmentState.phase === "uploading"
      ? "uploading"
      : agent.status === "error" || agent.data.phase === "error"
        ? "error"
        : isBusy
          ? "streaming"
          : agent.data.phase;

  const state: PlanWorkspaceState = {
    sessionId: forgeSessionId,
    hasStarted:
      agent.data.messages.length > 0 ||
      isBusy ||
      agent.status === "error" ||
      agent.data.phase === "error" ||
      agent.data.errors.length > 0 ||
      agent.data.currentArtifact !== null ||
      Boolean(initialPlan) ||
      Boolean(normalizedSnapshot && snapshotHasConversation(normalizedSnapshot)),
    sessionTitle: sessionTitleRef.current,
    artifactTitle:
      agent.data.artifactTitle ||
      normalizedSnapshot?.ui.artifactTitle ||
      initialPlan?.name ||
      "",
    planId: agent.data.planId ?? normalizedSnapshot?.ui.planId ?? planId ?? null,
    messages: agent.data.messages,
    currentArtifact:
      agent.data.currentArtifact ??
      normalizedSnapshot?.ui.currentArtifact ??
      initialPlan ??
      null,
    contextFileIds: attachmentState.contextFileIds,
    attachments: attachmentState.attachments,
    runStatus: agent.data.runStatus,
    warnings: agent.data.warnings,
    errors: agent.error
      ? [{ message: agent.error.message }, ...agent.data.errors]
      : agent.data.errors,
    phase,
    streamingAssistantText: agent.data.streamingAssistantText,
  };

  const previousArtifactRef = useRef(state.currentArtifact);
  useEffect(() => {
    if (previousArtifactRef.current && !state.currentArtifact) {
      onArtifactCleared?.();
    }
    previousArtifactRef.current = state.currentArtifact;
  }, [state.currentArtifact, onArtifactCleared]);

  useEffect(() => {
    hasSyncedSessionUrlRef.current = false;
  }, [forgeSessionId]);

  const attachFiles = useCallback(
    async (files: File[]) => {
      const validation = validateClientFiles(files);
      if (!validation.ok) {
        return;
      }

      const attachments = files.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        status: "pending" as const,
        displayLabel: file.name,
      }));

      dispatchAttachments({ type: "ATTACH_FILES", attachments });

      for (const attachment of attachments) {
        dispatchAttachments({
          type: "ATTACH_UPLOAD_START",
          localIds: [attachment.localId],
        });

        const result = await uploadContextFile({
          sessionId: forgeSessionId,
          file: attachment.file,
        });

        if (!result.ok) {
          dispatchAttachments({
            type: "ATTACH_UPLOAD_FAILURE",
            localId: attachment.localId,
            errorMessage: result.message,
          });
          continue;
        }

        dispatchAttachments({
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
    [forgeSessionId],
  );

  const sendMessage = useCallback(
    async (segments: PromptSegment[]) => {
      const displayPrompt = serializePromptDocument(segments).trim();
      const agentPrompt = serializePromptForAgent(segments).trim();
      if (displayPrompt.length === 0 || isBusy) {
        return;
      }

      await agent.send({ message: agentPrompt });
    },
    [agent, isBusy],
  );

  const restart = useCallback(() => {
    agent.reset();
    dispatchAttachments({ type: "RESTART", sessionId: forgeSessionId });
    sessionTitleRef.current = null;
  }, [agent, forgeSessionId]);

  const setArtifactTitle = useCallback((_artifactTitle: string) => {
    // Artifact title is driven by Eve tool results.
  }, []);

  const setPlanId = useCallback((_planId: string) => {
    // Plan id is driven by Eve tool results.
  }, []);

  const setArtifact = useCallback((_artifact: WorkoutPlan) => {
    // Artifact is driven by Eve tool results and plan save flows.
  }, []);

  useEffect(() => {
    const persistOnUnload = () => {
      if (state.messages.length === 0 && agent.events.length === 0) {
        return;
      }

      const workspaceSnapshot = buildCoachWorkspaceSnapshot({
        forgeSessionId,
        title: sessionTitleRef.current,
        ui: {
          planId: state.planId,
          artifactTitle: state.artifactTitle,
          currentArtifact: state.currentArtifact,
        },
        eve: agent.session.sessionId
          ? {
              sessionId: agent.session.sessionId,
              continuationToken: agent.session.continuationToken ?? "",
              streamIndex: agent.session.streamIndex,
              events: [...agent.events],
            }
          : null,
      });

      const payload = JSON.stringify({
        sessionId: forgeSessionId,
        snapshot: workspaceSnapshot,
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/coach/save-session", blob);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistOnUnload();
      }
    };

    window.addEventListener("beforeunload", persistOnUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", persistOnUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [agent.events, agent.session, forgeSessionId, state]);

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

export type { PlanWorkspaceState };
