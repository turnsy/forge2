"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, startTransition } from "react";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { useEveAgent } from "eve/react";
import {
  generateSessionTitleFromPrompt,
  initCoachThread,
  persistCoachSessionEve,
  saveSessionSnapshot,
} from "@/lib/chat/actions";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import {
  isTurnBoundaryEvent,
  isTurnComplete,
} from "@/lib/chat/adapters/plan/replay-eve-session";
import { buildForgeClientContextForSend } from "@/lib/chat/adapters/plan/forge-client-context";
import {
  resolveEffectiveClientArtifact,
  resolveOutboundClientArtifact,
  stablePlanJson,
  type ClientArtifactSnapshot,
} from "@/lib/chat/adapters/plan/plan-artifact-diff";
import { uploadContextFile } from "@/lib/chat/adapters/plan/upload-context-client";
import { validateClientFiles } from "@/lib/chat/adapters/plan/validate-client-files";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import {
  buildCoachWorkspaceSnapshot,
  getPersistedEveEvents,
  toEveSessionState,
  toForgeEvePointer,
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
import {
  useOptionalSessionNavigation,
  type PendingFirstSend,
} from "@/lib/chat/session-navigation-context";

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

function resolveInitialEveEvents(
  snapshot: CoachWorkspaceSnapshot | null,
  replayedEvents: readonly HandleMessageStreamEvent[],
): readonly HandleMessageStreamEvent[] {
  if (replayedEvents.length > 0) {
    return replayedEvents;
  }

  return snapshot ? getPersistedEveEvents(snapshot) : [];
}

function resolveInitialEveSession(
  snapshot: CoachWorkspaceSnapshot | null,
  initialEvents: readonly HandleMessageStreamEvent[],
): SessionState | undefined {
  if (!snapshot?.eve?.sessionId) {
    return undefined;
  }

  return toEveSessionState(snapshot.eve, initialEvents.length);
}

export function useCoachPlanWorkspace(options?: {
  initialPlan?: WorkoutPlan;
  planId?: string;
  initialSession?: { id: string; snapshot: CoachWorkspaceSnapshot };
  initialReplayedEvents?: readonly HandleMessageStreamEvent[];
  onArtifactCleared?: () => void;
  onThreadInitialized?: (payload: {
    sessionId: string;
    title: string | null;
  }) => void;
  onFirstSendNavigate?: (pending: PendingFirstSend) => void;
}) {
  const initialPlan = options?.initialPlan;
  const entryPlanId = options?.planId;
  const initialSession = options?.initialSession;
  const initialReplayedEvents = options?.initialReplayedEvents ?? [];
  const onArtifactCleared = options?.onArtifactCleared;
  const onThreadInitialized = options?.onThreadInitialized;
  const onFirstSendNavigate = options?.onFirstSendNavigate;
  const sessionNavigation = useOptionalSessionNavigation();
  const pendingContextFileIdsRef = useRef<string[]>([]);
  const consumedPendingSendRef = useRef(false);

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

  const initialEveEvents = useMemo(
    () =>
      resolveInitialEveEvents(
        normalizedSnapshot,
        initialReplayedEvents,
      ),
    [initialReplayedEvents, normalizedSnapshot],
  );

  const [sessionTitle, setSessionTitle] = useState<string | null>(
    normalizedSnapshot?.title ?? null,
  );
  const threadInitializedRef = useRef(
    Boolean(normalizedSnapshot && snapshotHasConversation(normalizedSnapshot)),
  );
  const initPromiseRef = useRef<Promise<boolean> | null>(null);
  const persistedEveSessionIdRef = useRef<string | null>(
    normalizedSnapshot?.eve?.sessionId ?? null,
  );
  const lastPersistedPointerRef = useRef<ForgeEvePointer | null>(
    normalizedSnapshot?.eve ?? null,
  );
  const latestAgentSessionRef = useRef<SessionState | null>(null);
  const lastSyncedAgentArtifactRef = useRef<string | null>(null);
  const sessionTitleRef = useRef(sessionTitle);
  const eventsForPersistenceRef = useRef<HandleMessageStreamEvent[]>([
    ...initialEveEvents,
  ]);
  const debouncedPersistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    sessionTitleRef.current = sessionTitle;
  }, [sessionTitle]);

  useEffect(() => {
    eventsForPersistenceRef.current = [...initialEveEvents];
  }, [initialEveEvents]);

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

          setSessionTitle(resolvedTitle);

          const result = await initCoachThread(forgeSessionId, resolvedTitle);
          if (!result.ok) {
            return false;
          }

          threadInitializedRef.current = true;
          onThreadInitialized?.({
            sessionId: forgeSessionId,
            title: resolvedTitle,
          });
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
        lastPersistedPointerRef.current?.sessionId === pointer.sessionId &&
        lastPersistedPointerRef.current?.continuationToken ===
          pointer.continuationToken &&
        lastPersistedPointerRef.current?.streamIndex === pointer.streamIndex
      ) {
        return;
      }

      const result = await persistCoachSessionEve(forgeSessionId, pointer);
      if (result.ok) {
        persistedEveSessionIdRef.current = pointer.sessionId;
        lastPersistedPointerRef.current = pointer;
      }
    },
    [forgeSessionId],
  );

  const persistEventSnapshot = useCallback(
    async (
      events: readonly HandleMessageStreamEvent[],
      session: SessionState,
    ) => {
      if (!threadInitializedRef.current) {
        return;
      }

      const pointer = toForgeEvePointer(session);
      if (!pointer) {
        return;
      }

      if (!isTurnComplete(events)) {
        await persistEvePointer(session);
        return;
      }

      const workspaceSnapshot = buildCoachWorkspaceSnapshot({
        forgeSessionId,
        title: sessionTitleRef.current,
        eve: pointer,
        eveEvents: events,
      });

      const result = await saveSessionSnapshot(
        forgeSessionId,
        workspaceSnapshot,
      );

      if (!result.ok) {
        return;
      }

      persistedEveSessionIdRef.current = pointer.sessionId;
      lastPersistedPointerRef.current = pointer;
    },
    [forgeSessionId, persistEvePointer],
  );

  const scheduleDebouncedPersist = useCallback(
    (events: readonly HandleMessageStreamEvent[], session: SessionState) => {
      if (debouncedPersistTimeoutRef.current) {
        clearTimeout(debouncedPersistTimeoutRef.current);
      }

      debouncedPersistTimeoutRef.current = setTimeout(() => {
        debouncedPersistTimeoutRef.current = null;
        if (isTurnComplete(events)) {
          void persistEventSnapshot(events, session);
        } else {
          void persistEvePointer(session);
        }
      }, 500);
    },
    [persistEvePointer, persistEventSnapshot],
  );

  const agent = useEveAgent({
    reducer: eveReducer,
    initialSession: resolveInitialEveSession(
      normalizedSnapshot,
      initialEveEvents,
    ),
    initialEvents: initialEveEvents,
    headers: () => ({
      [FORGE_SESSION_HEADER]: forgeSessionId,
    }),
    prepareSend: (input) => {
      const clientArtifact = resolveOutboundClientArtifact({
        agentArtifact: agentDataRef.current.currentArtifact,
        agentPlanId: agentDataRef.current.planId,
        agentTitle: agentDataRef.current.artifactTitle,
        localArtifact: localArtifactRef.current,
        localPlanId: localPlanIdRef.current,
        localTitle: localArtifactTitleRef.current,
      });

      return {
        ...input,
        clientContext: buildForgeClientContextForSend({
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
      latestAgentSessionRef.current = session;
      if (!threadInitializedRef.current) {
        return;
      }

      void persistEvePointer(session);
    },
    onEvent: (event) => {
      eventsForPersistenceRef.current = [
        ...eventsForPersistenceRef.current,
        event,
      ];

      if (!threadInitializedRef.current) {
        return;
      }

      const session = latestAgentSessionRef.current;
      if (!session) {
        return;
      }

      if (isTurnBoundaryEvent(event)) {
        void persistEventSnapshot(eventsForPersistenceRef.current, session);
        return;
      }

      scheduleDebouncedPersist(eventsForPersistenceRef.current, session);
    },
    onFinish: async (snapshot) => {
      if (!threadInitializedRef.current) {
        return;
      }

      eventsForPersistenceRef.current = [...snapshot.events];

      const pointer = toForgeEvePointer(snapshot.session);
      if (!pointer) {
        return;
      }

      if (!isTurnComplete(snapshot.events)) {
        await persistEvePointer(snapshot.session);
        return;
      }

      await persistEventSnapshot(snapshot.events, snapshot.session);
    },
  });

  useEffect(() => {
    latestAgentSessionRef.current = agent.session;
  }, [agent.session]);

  useEffect(() => {
    return () => {
      if (debouncedPersistTimeoutRef.current) {
        clearTimeout(debouncedPersistTimeoutRef.current);
      }

      const session = latestAgentSessionRef.current;
      if (!session?.sessionId || !threadInitializedRef.current) {
        return;
      }

      void persistEvePointer(session);
    };
  }, [persistEvePointer]);

  const [attachmentState, dispatchAttachments] = useReducer(
    attachmentReducer,
    createAttachmentState(),
  );
  const [isInitializingThread, setIsInitializingThread] = useState(false);

  const isBusy =
    agent.status === "submitted" || agent.status === "streaming";

  useEffect(() => {
    const agentPlan = agent.data.currentArtifact;
    if (!agentPlan) {
      lastSyncedAgentArtifactRef.current = null;
      return;
    }

    const agentJson = stablePlanJson(agentPlan);
    if (agentJson === lastSyncedAgentArtifactRef.current) {
      return;
    }

    lastSyncedAgentArtifactRef.current = agentJson;

    if (!isBusy) {
      return;
    }

    startTransition(() => {
      setLocalArtifact(agentPlan);
      setLocalPlanId(agent.data.planId);
      setLocalArtifactTitle(agent.data.artifactTitle || agentPlan.name);
    });
  }, [
    agent.data.artifactTitle,
    agent.data.currentArtifact,
    agent.data.planId,
    isBusy,
  ]);

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

  const phase: PlanWorkspaceState["phase"] = isInitializingThread
    ? "initializing"
    : attachmentState.phase === "uploading"
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
    sessionTitle,
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

  const previousArtifactRef = useRef<WorkoutPlan | null>(null);
  useEffect(() => {
    if (previousArtifactRef.current && !state.currentArtifact) {
      onArtifactCleared?.();
    }
    previousArtifactRef.current = state.currentArtifact;
  }, [state.currentArtifact, onArtifactCleared]);

  useEffect(() => {
    if (!initialSession || consumedPendingSendRef.current) {
      return;
    }

    const pending = sessionNavigation?.consumePendingFirstSend(forgeSessionId);
    if (!pending) {
      return;
    }

    consumedPendingSendRef.current = true;

    queueMicrotask(() => {
      if (pending.clientArtifact) {
        const title =
          pending.clientArtifact.title ?? pending.clientArtifact.plan.name;
        localArtifactRef.current = pending.clientArtifact.plan;
        localPlanIdRef.current = pending.clientArtifact.planId ?? null;
        localArtifactTitleRef.current = title;
        setLocalArtifact(pending.clientArtifact.plan);
        setLocalPlanId(pending.clientArtifact.planId ?? null);
        setLocalArtifactTitle(title);
      }

      if (pending.contextFileIds?.length) {
        pendingContextFileIdsRef.current = pending.contextFileIds;
      }

      void agent.send({ message: pending.message });
    });
  }, [agent, forgeSessionId, initialSession, sessionNavigation]);

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
      if (displayPrompt.length === 0 || isBusy || isInitializingThread) {
        return;
      }

      setIsInitializingThread(true);
      try {
        const initialized = await ensureThreadInitialized(
          sessionTitle,
          displayPrompt,
        );
        if (!initialized) {
          return;
        }
      } finally {
        setIsInitializingThread(false);
      }

      if (!initialSession) {
        const clientArtifact = resolveEffectiveClientArtifact({
          agentArtifact: agentDataRef.current.currentArtifact,
          agentPlanId: agentDataRef.current.planId,
          agentTitle: agentDataRef.current.artifactTitle,
          localArtifact: localArtifactRef.current,
          localPlanId: localPlanIdRef.current,
          localTitle: localArtifactTitleRef.current,
        });

        onFirstSendNavigate?.({
          sessionId: forgeSessionId,
          message: agentPrompt,
          clientArtifact: clientArtifact
            ? {
                plan: clientArtifact.plan,
                planId: clientArtifact.planId,
                title: clientArtifact.title,
              }
            : null,
          contextFileIds:
            attachmentState.contextFileIds.length > 0
              ? attachmentState.contextFileIds
              : undefined,
        });
        return;
      }

      await agent.send({ message: agentPrompt });
    },
    [
      agent,
      attachmentState.contextFileIds,
      ensureThreadInitialized,
      forgeSessionId,
      initialSession,
      isBusy,
      isInitializingThread,
      onFirstSendNavigate,
      sessionTitle,
    ],
  );

  const restart = useCallback(() => {
    if (debouncedPersistTimeoutRef.current) {
      clearTimeout(debouncedPersistTimeoutRef.current);
      debouncedPersistTimeoutRef.current = null;
    }

    agent.reset();
    dispatchAttachments({ type: "RESTART", sessionId: forgeSessionId });
    setSessionTitle(null);
    initPromiseRef.current = null;
    threadInitializedRef.current = false;
    persistedEveSessionIdRef.current = null;
    eventsForPersistenceRef.current = [];
    setIsInitializingThread(false);
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
