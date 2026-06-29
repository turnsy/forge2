"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { useEveAgent } from "eve/react";
import {
  generateSessionTitleFromPrompt,
  initCoachThread,
  persistCoachSessionEve,
  saveSessionSnapshot,
} from "@/lib/chat/actions";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import { buildForgeClientContext } from "@/lib/chat/adapters/plan/forge-client-context";
import {
  resolveEffectiveClientArtifact,
} from "@/lib/chat/adapters/plan/plan-artifact-diff";
import { uploadContextFile } from "@/lib/chat/adapters/plan/upload-context-client";
import { validateClientFiles } from "@/lib/chat/adapters/plan/validate-client-files";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import {
  buildCoachWorkspaceSnapshot,
  toEveSessionState,
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
  type ForgeEvePointer,
} from "@/lib/chat/session-types";
import { snapshotHasConversation } from "@/lib/chat/snapshot-messages";
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

function toForgeEvePointer(session: SessionState): ForgeEvePointer | null {
  if (!session.sessionId) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    continuationToken: session.continuationToken ?? "",
  };
}

export function useCoachPlanWorkspace(options?: {
  initialPlan?: WorkoutPlan;
  planId?: string;
  initialSession?: { id: string; snapshot: CoachWorkspaceSnapshot };
  initialReplayedEvents?: readonly HandleMessageStreamEvent[];
  onArtifactCleared?: () => void;
  onSessionPersisted?: (sessionId: string) => void;
  onThreadInitialized?: (sessionId: string) => void;
}) {
  const initialPlan = options?.initialPlan;
  const entryPlanId = options?.planId;
  const initialSession = options?.initialSession;
  const initialReplayedEvents = options?.initialReplayedEvents ?? [];
  const onArtifactCleared = options?.onArtifactCleared;
  const onSessionPersisted = options?.onSessionPersisted;
  const onThreadInitialized = options?.onThreadInitialized;
  const hasSyncedSessionUrlRef = useRef(false);

  const normalizedSnapshot = useMemo(() => {
    if (!initialSession) {
      return null;
    }

    return withForgeSessionId(initialSession.id, initialSession.snapshot);
  }, [initialSession]);

  const [forgeSessionId] = useState(() => {
    if (initialSession?.id) {
      return initialSession.id;
    }
    return createSessionId();
  });

  const [localArtifact, setLocalArtifact] = useState<WorkoutPlan | null>(
    initialPlan ?? null,
  );
  const [localPlanId, setLocalPlanId] = useState<string | null>(
    entryPlanId ?? null,
  );
  const [localArtifactTitle, setLocalArtifactTitle] = useState(
    initialPlan?.name ?? "",
  );

  const reducerSeedMessages = useMemo(() => [], []);

  const eveReducer = useMemo(
    () =>
      createEveCoachReducer({
        messages: reducerSeedMessages,
        currentArtifact: null,
        planId: null,
        artifactTitle: "",
      }),
    [reducerSeedMessages],
  );

  const sessionTitleRef = useRef<string | null>(
    normalizedSnapshot?.title ?? null,
  );
  const threadInitializedRef = useRef(
    Boolean(normalizedSnapshot && snapshotHasConversation(normalizedSnapshot)),
  );
  const initPromiseRef = useRef<Promise<boolean> | null>(null);
  const persistedEveSessionIdRef = useRef<string | null>(
    normalizedSnapshot?.eve?.sessionId ?? null,
  );

  const buildClientArtifactSnapshot = useCallback(
    (agentData: {
      currentArtifact: WorkoutPlan | null;
      planId: string | null;
      artifactTitle: string;
    }): ClientArtifactSnapshot | null =>
      resolveEffectiveClientArtifact({
        agentArtifact: agentData.currentArtifact,
        agentPlanId: agentData.planId,
        agentTitle: agentData.artifactTitle,
        localArtifact,
        localPlanId,
        localTitle: localArtifactTitle,
      }),
    [localArtifact, localArtifactTitle, localPlanId],
  );

  const agentDataRef = useRef({
    currentArtifact: null as WorkoutPlan | null,
    planId: null as string | null,
    artifactTitle: "",
  });
  const localArtifactRef = useRef(localArtifact);
  const localPlanIdRef = useRef(localPlanId);
  const localArtifactTitleRef = useRef(localArtifactTitle);

  useEffect(() => {
    localArtifactRef.current = localArtifact;
    localPlanIdRef.current = localPlanId;
    localArtifactTitleRef.current = localArtifactTitle;
  }, [localArtifact, localArtifactTitle, localPlanId]);

  const ensureThreadInitialized = useCallback(
    async (title: string | null, displayPrompt: string) => {
      if (threadInitializedRef.current) {
        return true;
      }

      if (!initPromiseRef.current) {
        initPromiseRef.current = (async () => {
          const resolvedTitle =
            title ??
            (await generateSessionTitleFromPrompt(displayPrompt).catch(
              () => null,
            ));

          sessionTitleRef.current = resolvedTitle;

          const result = await initCoachThread(forgeSessionId, resolvedTitle);
          if (!result.ok) {
            return false;
          }

          threadInitializedRef.current = true;
          onThreadInitialized?.(forgeSessionId);
          return true;
        })();
      }

      return initPromiseRef.current;
    },
    [forgeSessionId, onThreadInitialized],
  );

  const persistEvePointer = useCallback(
    async (session: SessionState) => {
      const pointer = toForgeEvePointer(session);
      if (!pointer) {
        return;
      }

      if (
        persistedEveSessionIdRef.current === pointer.sessionId &&
        normalizedSnapshot?.eve?.continuationToken === pointer.continuationToken
      ) {
        return;
      }

      const result = await persistCoachSessionEve(forgeSessionId, pointer);
      if (result.ok) {
        persistedEveSessionIdRef.current = pointer.sessionId;
      }
    },
    [forgeSessionId, normalizedSnapshot?.eve?.continuationToken],
  );

  const agent = useEveAgent({
    reducer: eveReducer,
    initialSession: normalizedSnapshot?.eve
      ? toEveSessionState(
          normalizedSnapshot.eve,
          initialReplayedEvents.length,
        )
      : undefined,
    initialEvents: initialReplayedEvents,
    preserveCompletedSessions: true,
    headers: () => ({
      [FORGE_SESSION_HEADER]: forgeSessionId,
    }),
    prepareSend: (input) => {
      const clientArtifact = resolveEffectiveClientArtifact({
        agentArtifact: agentDataRef.current.currentArtifact,
        agentPlanId: agentDataRef.current.planId,
        agentTitle: agentDataRef.current.artifactTitle,
        localArtifact: localArtifactRef.current,
        localPlanId: localPlanIdRef.current,
        localTitle: localArtifactTitleRef.current,
      });

      return {
        ...input,
        clientContext: buildForgeClientContext({
          forgeSessionId,
          clientArtifact: clientArtifact
            ? {
                plan: clientArtifact.plan,
                planId: clientArtifact.planId,
                title: clientArtifact.title,
              }
            : null,
        }),
      };
    },
    onSessionChange: (session) => {
      if (!threadInitializedRef.current) {
        return;
      }

      void persistEvePointer(session);
    },
    onFinish: async (snapshot) => {
      if (!threadInitializedRef.current) {
        return;
      }

      const pointer = toForgeEvePointer(snapshot.session);
      if (!pointer) {
        return;
      }

      const workspaceSnapshot = buildCoachWorkspaceSnapshot({
        forgeSessionId,
        title: sessionTitleRef.current,
        eve: pointer,
      });

      const result = await saveSessionSnapshot(
        forgeSessionId,
        workspaceSnapshot,
      );

      if (!result.ok) {
        return;
      }

      persistedEveSessionIdRef.current = pointer.sessionId;

      if (!hasSyncedSessionUrlRef.current && onSessionPersisted) {
        hasSyncedSessionUrlRef.current = true;
        onSessionPersisted(forgeSessionId);
      }
    },
  });

  const [attachmentState, dispatchAttachments] = useReducer(
    attachmentReducer,
    createAttachmentState(),
  );

  const isBusy =
    agent.status === "submitted" || agent.status === "streaming";

  const effectiveArtifact = buildClientArtifactSnapshot(agent.data);
  const displayedArtifact = effectiveArtifact?.plan ?? null;
  const displayedPlanId = effectiveArtifact?.planId ?? null;
  const displayedArtifactTitle = effectiveArtifact?.title ?? "";

  useEffect(() => {
    agentDataRef.current = {
      currentArtifact: agent.data.currentArtifact,
      planId: agent.data.planId,
      artifactTitle: agent.data.artifactTitle,
    };
  }, [
    agent.data.artifactTitle,
    agent.data.currentArtifact,
    agent.data.planId,
  ]);

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
      displayedArtifact !== null ||
      Boolean(initialPlan) ||
      Boolean(normalizedSnapshot && snapshotHasConversation(normalizedSnapshot)),
    sessionTitle: sessionTitleRef.current,
    artifactTitle: displayedArtifactTitle,
    planId: displayedPlanId,
    messages: agent.data.messages,
    currentArtifact: displayedArtifact,
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

      const initialized = await ensureThreadInitialized(
        sessionTitleRef.current,
        displayPrompt,
      );
      if (!initialized) {
        return;
      }

      await agent.send({ message: agentPrompt });
    },
    [agent, ensureThreadInitialized, isBusy],
  );

  const restart = useCallback(() => {
    agent.reset();
    dispatchAttachments({ type: "RESTART", sessionId: forgeSessionId });
    sessionTitleRef.current = null;
    initPromiseRef.current = null;
    threadInitializedRef.current = false;
    persistedEveSessionIdRef.current = null;
    setLocalArtifact(initialPlan ?? null);
    setLocalPlanId(entryPlanId ?? null);
    setLocalArtifactTitle(initialPlan?.name ?? "");
  }, [agent, entryPlanId, forgeSessionId, initialPlan]);

  const setArtifactTitle = useCallback((artifactTitle: string) => {
    setLocalArtifactTitle(artifactTitle);
    setLocalArtifact((current) =>
      current ? { ...current, name: artifactTitle } : current,
    );
  }, []);

  const setPlanId = useCallback((planId: string) => {
    setLocalPlanId(planId);
  }, []);

  const setArtifact = useCallback((artifact: WorkoutPlan) => {
    setLocalArtifact(artifact);
    setLocalArtifactTitle(artifact.name);
  }, []);

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
