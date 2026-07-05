"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, startTransition } from "react";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { useEveAgent } from "eve/react";
import {
  generateSessionTitleFromPrompt,
  saveSessionSnapshot,
} from "@/lib/chat/actions";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
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
  onSessionUrlNavigate?: (sessionId: string) => void;
}) {
  const initialPlan = options?.initialPlan;
  const entryPlanId = options?.planId;
  const initialSession = options?.initialSession;
  const initialReplayedEvents = options?.initialReplayedEvents ?? [];
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

  const persistWorkspaceSnapshot = useCallback(
    async (
      session: SessionState,
      events: readonly HandleMessageStreamEvent[],
    ) => {
      const pointer = toForgeEvePointer(session);
      if (!pointer) {
        return false;
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
        return false;
      }

      lastPersistedPointerRef.current = pointer;
      hasPersistedSessionRef.current = true;
      return true;
    },
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

  const syncPersistedSnapshot = useCallback(
    async (events: readonly HandleMessageStreamEvent[]) => {
      const session = latestAgentSessionRef.current;
      if (!session?.sessionId) {
        return false;
      }

      return persistWorkspaceSnapshot(session, events);
    },
    [persistWorkspaceSnapshot],
  );

  const initialEveEvents = useMemo(
    () =>
      resolveInitialEveEvents(
        normalizedSnapshot,
        initialReplayedEvents,
      ),
    [initialReplayedEvents, normalizedSnapshot],
  );

  const eveClient = useMemo(
    () => createForgeEveClient(forgeSessionId),
    [forgeSessionId],
  );

  const maybeRedirectToSessionUrlRef = useRef(maybeRedirectToSessionUrl);
  maybeRedirectToSessionUrlRef.current = maybeRedirectToSessionUrl;

  const syncPersistedSnapshotRef = useRef(syncPersistedSnapshot);
  syncPersistedSnapshotRef.current = syncPersistedSnapshot;

  const onEvePostResponseRef = useRef<(response: ForgeEvePostResponse) => void>(
    () => {},
  );
  onEvePostResponseRef.current = (response) => {
    latestAgentSessionRef.current = {
      sessionId: response.sessionId,
      continuationToken: response.continuationToken,
      streamIndex: latestAgentEventsRef.current.length,
    };
  };

  const handleAgentStreamEventRef = useRef<
    (event: HandleMessageStreamEvent) => void
  >(() => {});
  handleAgentStreamEventRef.current = (event) => {
    const nextEvents = [...latestAgentEventsRef.current, event];
    latestAgentEventsRef.current = nextEvents;

    void syncPersistedSnapshotRef.current(nextEvents).then((saved) => {
      if (saved) {
        maybeRedirectToSessionUrlRef.current();
      }
    });
  };

  const eveSession = useMemo(
    () =>
      bindForgeEveSessionSend(
        eveClient.session(
          resolveInitialEveSession(normalizedSnapshot, initialEveEvents),
        ),
        (response) => {
          onEvePostResponseRef.current(response);
        },
      ),
    [eveClient, initialEveEvents, normalizedSnapshot],
  );

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
      const saved = await persistWorkspaceSnapshot(
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

  useEffect(() => {
    return () => {
      const session = latestAgentSessionRef.current;
      const events = latestAgentEventsRef.current;

      if (!session?.sessionId || !hasPersistedSessionRef.current) {
        return;
      }

      void persistWorkspaceSnapshot(session, events);
    };
  }, [persistWorkspaceSnapshot]);

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

      await agent.send({ message: agentPrompt });
    },
    [agent, ensureSessionTitle, isBusy, isInitializingThread],
  );

  const restart = useCallback(() => {
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
