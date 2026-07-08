"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, startTransition } from "react";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { isCurrentTurnBoundaryEvent } from "eve/client";
import { useEveAgent } from "eve/react";
import {
  generateSessionTitleFromPrompt,
  saveSessionSnapshot,
} from "@/lib/chat/actions";
import {
  applyCoachEveLoadPhase,
  applyUserStoppedTurn,
  type CoachEveLoadPhase,
} from "@/lib/chat/adapters/plan/coach-eve-session";
import {
  buildPersistedCoachSnapshot,
  createCoachEvePersister,
} from "@/lib/chat/adapters/plan/coach-eve-persist";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import {
  IN_FLIGHT_TAIL_TIMEOUT_MS,
  isTurnComplete,
} from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  bindForgeEveSessionSend,
  createForgeEveClient,
  type ForgeEvePostResponse,
} from "@/lib/chat/adapters/plan/forge-eve-client";
import { buildForgeClientContextForSend } from "@/lib/chat/adapters/plan/forge-client-context";
import {
  resolveEffectiveClientArtifact,
  resolveOutboundClientArtifact,
  stablePlanJson,
  type ClientArtifactSnapshot,
} from "@/lib/chat/adapters/plan/plan-artifact-diff";
import { uploadContextFile } from "@/lib/chat/adapters/plan/upload-context-client";
import { validateClientFiles } from "@/lib/chat/adapters/plan/validate-client-files";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import {
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

const EMPTY_SYNCED_EVENTS: readonly HandleMessageStreamEvent[] = [];

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
  syncedEvents?: readonly HandleMessageStreamEvent[];
  loadPhase?: CoachEveLoadPhase;
  onArtifactCleared?: () => void;
  onThreadInitialized?: (payload: {
    sessionId: string;
    title: string | null;
  }) => void;
  onSessionUrlNavigate?: (sessionId: string) => void;
}) {
  const initialPlan = options?.initialPlan;
  const entryPlanId = options?.planId;
  const initialSession = options?.initialSession;
  const syncedEvents = options?.syncedEvents ?? EMPTY_SYNCED_EVENTS;
  const loadPhase = options?.loadPhase ?? "idle";
  const onArtifactCleared = options?.onArtifactCleared;
  const onThreadInitialized = options?.onThreadInitialized;
  const onSessionUrlNavigate = options?.onSessionUrlNavigate;

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
  const [sessionTitle, setSessionTitle] = useState<string | null>(
    normalizedSnapshot?.title ?? null,
  );
  const hasPersistedSessionRef = useRef(
    Boolean(normalizedSnapshot?.eve?.sessionId),
  );
  const hasRedirectedRef = useRef(Boolean(initialSession));
  const titlePromiseRef = useRef<Promise<boolean> | null>(null);
  const lastPersistedPointerRef = useRef<ForgeEvePointer | null>(
    normalizedSnapshot?.eve ?? null,
  );
  const latestAgentSessionRef = useRef<SessionState | null>(null);
  const latestAgentEventsRef = useRef<readonly HandleMessageStreamEvent[]>([]);
  const tailResumeAbortRef = useRef<AbortController | null>(null);
  const lastSyncedAgentArtifactRef = useRef<string | null>(null);

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

  const ensureSessionTitle = useCallback(
    async (title: string | null, displayPrompt: string) => {
      if (sessionTitleRef.current !== null) {
        return true;
      }

      if (!titlePromiseRef.current) {
        titlePromiseRef.current = (async () => {
          const resolvedTitle =
            title ??
            (await generateSessionTitleFromPrompt(displayPrompt).catch(
              () => null,
            ));

          sessionTitleRef.current = resolvedTitle;
          setSessionTitle(resolvedTitle);
          return true;
        })();
      }

      return titlePromiseRef.current;
    },
    [],
  );

  /* eslint-disable react-hooks/refs -- persistence and Eve callbacks read refs at event time */
  const persister = useMemo(
    () =>
      createCoachEvePersister({
        forgeSessionId,
        getTitle: () => sessionTitleRef.current,
        saveSnapshot: async (input) => {
          const result = await saveSessionSnapshot(
            forgeSessionId,
            buildPersistedCoachSnapshot(input),
          );

          if (!result.ok) {
            return false;
          }

          const pointer = toForgeEvePointer({
            ...input.session,
            streamIndex: input.events.length,
          });

          if (pointer) {
            lastPersistedPointerRef.current = pointer;
          }

          hasPersistedSessionRef.current = true;
          return true;
        },
      }),
    [forgeSessionId],
  );

  const maybeRedirectToSessionUrl = useCallback(() => {
    if (
      initialSession ||
      hasRedirectedRef.current ||
      !hasPersistedSessionRef.current ||
      latestAgentEventsRef.current.length === 0
    ) {
      return;
    }

    hasRedirectedRef.current = true;
    onThreadInitialized?.({
      sessionId: forgeSessionId,
      title: sessionTitleRef.current,
    });
    onSessionUrlNavigate?.(forgeSessionId);
  }, [
    forgeSessionId,
    initialSession,
    onSessionUrlNavigate,
    onThreadInitialized,
  ]);

  const maybeRedirectToSessionUrlRef = useRef(maybeRedirectToSessionUrl);

  const persisterRef = useRef(persister);

  const handleEvePostResponse = useCallback((response: ForgeEvePostResponse) => {
    latestAgentSessionRef.current = {
      sessionId: response.sessionId,
      continuationToken: response.continuationToken,
      streamIndex: latestAgentEventsRef.current.length,
    };
  }, []);

  const handleAgentStreamEventRef = useRef<
    (event: HandleMessageStreamEvent) => void
  >(() => {});

  useLayoutEffect(() => {
    maybeRedirectToSessionUrlRef.current = maybeRedirectToSessionUrl;
    persisterRef.current = persister;
    handleAgentStreamEventRef.current = (event) => {
      const session = latestAgentSessionRef.current;
      if (!session?.sessionId) {
        return;
      }

      const nextEvents = [...latestAgentEventsRef.current, event];
      latestAgentEventsRef.current = nextEvents;

      void persisterRef.current
        .onStreamEvent(session, nextEvents, event)
        .then((saved) => {
          if (saved) {
            maybeRedirectToSessionUrlRef.current();
          }
        });
    };
  });

  const initialEveEvents = syncedEvents;

  const eveClient = useMemo(
    () => createForgeEveClient(forgeSessionId),
    [forgeSessionId],
  );

  const eveSession = useMemo(
    () =>
      bindForgeEveSessionSend(
        eveClient.session(
          resolveInitialEveSession(normalizedSnapshot, initialEveEvents),
        ),
        handleEvePostResponse,
      ),
    [eveClient, handleEvePostResponse, initialEveEvents, normalizedSnapshot],
  );
  /* eslint-enable react-hooks/refs */

  const agent = useEveAgent({
    reducer: eveReducer,
    session: eveSession,
    initialEvents: initialEveEvents,
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
    onEvent: (event) => {
      handleAgentStreamEventRef.current(event);
    },
    onFinish: async (snapshot) => {
      const pointer = toForgeEvePointer(snapshot.session);
      if (!pointer) {
        return;
      }

      latestAgentSessionRef.current = snapshot.session;
      latestAgentEventsRef.current = snapshot.events;
      const saved = await persisterRef.current.flush(
        snapshot.session,
        snapshot.events,
      );
      if (saved) {
        maybeRedirectToSessionUrlRef.current();
      }
    },
  });

  useEffect(() => {
    latestAgentSessionRef.current = agent.session;
    latestAgentEventsRef.current = agent.events;
  }, [agent.events, agent.session]);

  const evePointer = normalizedSnapshot?.eve;
  const tailResumeKey =
    loadPhase === "waiting" && evePointer?.sessionId
      ? `${evePointer.sessionId}:${evePointer.continuationToken ?? ""}:${syncedEvents.length}`
      : null;
  const syncedEventsRef = useRef(syncedEvents);
  const normalizedSnapshotRef = useRef(normalizedSnapshot);

  useLayoutEffect(() => {
    syncedEventsRef.current = syncedEvents;
    normalizedSnapshotRef.current = normalizedSnapshot;
  }, [normalizedSnapshot, syncedEvents]);

  const [resumedEvents, setResumedEvents] =
    useState<readonly HandleMessageStreamEvent[]>(syncedEvents);
  const [isResumingStream, setIsResumingStream] = useState(
    () => loadPhase === "waiting",
  );
  const [resumeInterrupted, setResumeInterrupted] = useState(false);
  const [userStopped, setUserStopped] = useState(false);

  useEffect(() => {
    if (!tailResumeKey) {
      return;
    }

    const snapshot = normalizedSnapshotRef.current;
    const eve = snapshot?.eve;
    if (!eve?.sessionId) {
      return;
    }

    const abortController = new AbortController();
    tailResumeAbortRef.current = abortController;
    let cancelled = false;
    let events = [...syncedEventsRef.current];

    const resume = async () => {
      setIsResumingStream(true);
      setResumeInterrupted(false);

      const session = resolveInitialEveSession(snapshot, events);
      if (!session?.sessionId) {
        setIsResumingStream(false);
        return;
      }

      const timeout = setTimeout(
        () => abortController.abort(),
        IN_FLIGHT_TAIL_TIMEOUT_MS,
      );

      try {
        const stream = eveClient.session(session).stream({
          startIndex: events.length,
          signal: abortController.signal,
        });

        for await (const event of stream) {
          if (cancelled || abortController.signal.aborted) {
            break;
          }

          events = [...events, event];
          setResumedEvents(events);
          latestAgentEventsRef.current = events;
          handleAgentStreamEventRef.current(event);

          if (isCurrentTurnBoundaryEvent(event)) {
            break;
          }
        }
      } catch (error) {
        if (!cancelled && !abortController.signal.aborted) {
          console.error("Failed to resume Eve session stream", error);
        }
      } finally {
        clearTimeout(timeout);
        if (cancelled) {
          return;
        }

        setIsResumingStream(false);

        if (!isTurnComplete(events)) {
          setResumeInterrupted(true);
          return;
        }

        void persisterRef.current.flush(
          toEveSessionState(eve, events.length),
          events,
        );
      }
    };

    setResumedEvents(syncedEventsRef.current);
    void resume();

    return () => {
      cancelled = true;
      abortController.abort();
      if (tailResumeAbortRef.current === abortController) {
        tailResumeAbortRef.current = null;
      }
    };
  }, [eveClient, tailResumeKey]);

  useEffect(() => {
    return () => {
      persisterRef.current.dispose();
    };
  }, []);

  const [attachmentState, dispatchAttachments] = useReducer(
    attachmentReducer,
    createAttachmentState(),
  );
  const [isInitializingThread, setIsInitializingThread] = useState(false);

  const resumedProjection = useMemo(() => {
    if (loadPhase !== "waiting" && resumedEvents.length <= syncedEvents.length) {
      return null;
    }

    let data = eveReducer.initial();
    for (const event of resumedEvents) {
      data = eveReducer.reduce(data, event);
    }
    return data;
  }, [eveReducer, loadPhase, resumedEvents, syncedEvents.length]);

  const effectiveLoadPhase: CoachEveLoadPhase = resumeInterrupted
    ? "interrupted"
    : loadPhase === "waiting" && isTurnComplete(resumedEvents)
      ? "ready"
      : loadPhase;

  const isWaitingOnAgent =
    effectiveLoadPhase === "waiting" && !resumeInterrupted;

  const projectionData = resumedProjection ?? agent.data;
  const workspaceData = userStopped
    ? applyUserStoppedTurn(
        applyCoachEveLoadPhase(effectiveLoadPhase, projectionData),
      )
    : applyCoachEveLoadPhase(effectiveLoadPhase, projectionData);

  const isBusy =
    isResumingStream ||
    agent.status === "submitted" ||
    agent.status === "streaming" ||
    (isWaitingOnAgent && workspaceData.streamingAssistantText.trim().length === 0);
  const effectiveIsBusy = isBusy && !userStopped;

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

    if (!effectiveIsBusy) {
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
    effectiveIsBusy,
  ]);

  const effectiveArtifact = buildClientArtifactSnapshot(projectionData);
  const displayedArtifact = effectiveArtifact?.plan ?? null;
  const displayedPlanId = effectiveArtifact?.planId ?? null;
  const displayedArtifactTitle = effectiveArtifact?.title ?? "";

  useEffect(() => {
    agentDataRef.current = {
      currentArtifact: projectionData.currentArtifact,
      planId: projectionData.planId,
      artifactTitle: projectionData.artifactTitle,
    };
  }, [
    projectionData.artifactTitle,
    projectionData.currentArtifact,
    projectionData.planId,
  ]);

  const phase: PlanWorkspaceState["phase"] = isInitializingThread
    ? "initializing"
    : attachmentState.phase === "uploading"
      ? "uploading"
      : agent.status === "error" || workspaceData.phase === "error"
        ? "error"
        : effectiveIsBusy
          ? "streaming"
          : workspaceData.phase;

  const state: PlanWorkspaceState = {
    sessionId: forgeSessionId,
    hasStarted:
      workspaceData.messages.length > 0 ||
      effectiveIsBusy ||
      agent.status === "error" ||
      workspaceData.phase === "error" ||
      workspaceData.errors.length > 0 ||
      displayedArtifact !== null ||
      Boolean(initialPlan) ||
      Boolean(normalizedSnapshot && snapshotHasConversation(normalizedSnapshot)),
    sessionTitle,
    artifactTitle: displayedArtifactTitle,
    planId: displayedPlanId,
    messages: workspaceData.messages,
    currentArtifact: displayedArtifact,
    contextFileIds: attachmentState.contextFileIds,
    attachments: attachmentState.attachments,
    runStatus: isWaitingOnAgent && workspaceData.runStatus === null
      ? null
      : workspaceData.runStatus,
    warnings: workspaceData.warnings,
    errors: agent.error
      ? [{ message: agent.error.message }, ...workspaceData.errors]
      : workspaceData.errors,
    phase,
    streamingAssistantText: workspaceData.streamingAssistantText,
  };

  const previousArtifactRef = useRef<WorkoutPlan | null>(null);
  useEffect(() => {
    if (previousArtifactRef.current && !state.currentArtifact) {
      onArtifactCleared?.();
    }
    previousArtifactRef.current = state.currentArtifact;
  }, [state.currentArtifact, onArtifactCleared]);

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
      if (displayPrompt.length === 0 || effectiveIsBusy || isInitializingThread) {
        return;
      }

      setIsInitializingThread(true);
      try {
        const titled = await ensureSessionTitle(
          sessionTitleRef.current,
          displayPrompt,
        );
        if (!titled) {
          return;
        }
      } finally {
        setIsInitializingThread(false);
      }

      setUserStopped(false);
      await agent.send({ message: agentPrompt });
    },
    [agent, ensureSessionTitle, effectiveIsBusy, isInitializingThread],
  );

  const restart = useCallback(() => {
    tailResumeAbortRef.current?.abort();
    tailResumeAbortRef.current = null;
    setResumeInterrupted(false);
    setUserStopped(false);
    agent.reset();
    dispatchAttachments({ type: "RESTART", sessionId: forgeSessionId });
    sessionTitleRef.current = null;
    setSessionTitle(null);
    titlePromiseRef.current = null;
    hasPersistedSessionRef.current = false;
    hasRedirectedRef.current = false;
    lastPersistedPointerRef.current = null;
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

  const stopResponse = useCallback(() => {
    tailResumeAbortRef.current?.abort();
    tailResumeAbortRef.current = null;
    setResumeInterrupted(false);
    agent.stop();
    setUserStopped(true);
  }, [agent]);

  return {
    state,
    attachFiles,
    sendMessage,
    stopResponse,
    restart,
    setArtifactTitle,
    setPlanId,
    setArtifact,
  };
}

export type { PlanWorkspaceState };
