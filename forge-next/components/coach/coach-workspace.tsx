"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";
import { SessionHistoryMobileToggle } from "@/components/coach/session-history-mobile";
import { SessionHistoryMobilePanel } from "@/components/coach/session-history-mobile-panel";
import { CoachConversationPanel } from "@/components/coach/coach-conversation-panel";
import { MobileComposerToolbar } from "@/components/coach/mobile-composer-toolbar";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import { ChatComposer } from "@/components/chat/chat-composer";
import { EyeIcon } from "@/components/icons/eye-icon";
import { SidebarToggleIcon } from "@/components/icons/sidebar-toggle-icon";
import { CoachSessionLoadingView } from "@/components/coach/coach-session-loading-view";
import { Button, FadeIn, IconButton, PageBackLink } from "@/components/ui";
import {
  DESKTOP_ARTIFACT_COLUMN_CLASS,
  DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS,
  DESKTOP_CHAT_COLLAPSED_RAIL_CLASS,
  DESKTOP_CHAT_COLLAPSED_WIDTH,
  DESKTOP_CHAT_GRID_TRANSITION_CLASS,
  DESKTOP_CHAT_COLUMN_CLASS,
  DESKTOP_CHAT_TOGGLE_ROW_CLASS,
  DESKTOP_SPLIT_GRID_COLUMNS_EXPANDED,
  DESKTOP_WORKSPACE_HEIGHT_CLASS,
} from "@/lib/coach/desktop-workspace-layout";
import {
  MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS,
  MOBILE_HISTORY_OVERLAY_CLASS,
  MOBILE_WORKSPACE_X_PADDING_CLASS,
} from "@/lib/coach/mobile-workspace-layout";
import { artifactStructureKey } from "@/lib/coach/artifact-scroll";
import { useScrollTopOnKey } from "@/lib/hooks/use-scroll-top-on-key";
import { PAGE_CONTENT_INSET_X_CLASS } from "@/lib/layout/page-layout";
import {
  hasOverlayScrollLane,
  OVERLAY_SCROLL_LANE_CLASS,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";
import { isChatRunning } from "@/lib/chat";
import { toArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import {
  isCoachEveSessionLoading,
  useCoachEveCatchUp,
} from "@/lib/chat/adapters/plan/coach-eve-session";
import type { TurnFinalizeReason } from "@/lib/chat/adapters/plan/turn-lifecycle";
import { saveSessionSnapshot } from "@/lib/chat/actions";
import {
  buildPersistedCoachSnapshot,
} from "@/lib/chat/adapters/plan/coach-eve-persist";
import { isTurnComplete } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  getPersistedEveEvents,
  toEveSessionState,
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";
import { navigateToCoachHome, syncCoachSessionUrl, syncCoachWorkspaceUrl } from "@/lib/chat/session-url";
import { useOptionalSessionNavigation } from "@/lib/chat/session-navigation-context";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useSavePlan } from "@/lib/plans/use-save-plan";
import {
  createPlanSnapshot,
  hasUnsavedPlanChanges,
} from "@/lib/plans/snapshot";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { roleLinkClass } from "@/lib/theme";
import type { HandleMessageStreamEvent } from "eve/client";

function ChatWorkspaceShell({
  children,
  headerClassName,
  className = "",
  headerStart,
  headerActions,
}: {
  children: ReactNode;
  headerClassName?: string;
  className?: string;
  headerStart?: ReactNode;
  headerActions?: ReactNode;
}) {
  const showHeader = Boolean(headerStart || headerActions);

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}>
      {showHeader ? (
        <div className={headerClassName}>
          {headerStart ?? <span />}
          <div className="flex items-center gap-1">{headerActions}</div>
        </div>
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function ArtifactPanelScrollLane({
  scrollResetKey,
  scrollPaddingTop,
  scrollPaddingBottom,
  contentInsetClassName,
  children,
}: {
  scrollResetKey: string;
  scrollPaddingTop?: number;
  scrollPaddingBottom?: number;
  contentInsetClassName: string;
  children: ReactNode;
}) {
  const lanePadding = { scrollPaddingTop, scrollPaddingBottom };
  const lanePositioned = hasOverlayScrollLane(lanePadding);
  const chromeReady = !lanePositioned || scrollPaddingTop !== undefined;
  const scrollRef = useScrollTopOnKey(
    `${scrollResetKey}:${scrollPaddingTop ?? 0}:${scrollPaddingBottom ?? 0}`,
    chromeReady,
  );

  return (
    <div
      ref={scrollRef}
      className={`${lanePositioned ? OVERLAY_SCROLL_LANE_CLASS : "absolute inset-0 z-0 overflow-x-hidden overflow-y-auto"}${contentInsetClassName ? ` ${contentInsetClassName}` : ""}`}
      style={lanePositioned ? overlayScrollLaneStyle(lanePadding) : undefined}
    >
      {children}
    </div>
  );
}

function ArtifactPanel({
  state,
  artifactFadeKey,
  artifactScrollResetKey,
  resolvedBackHref,
  saveStatus,
  saveError,
  onBackClick,
  onTitleChange,
  onSave,
  disabled,
  onPlanChange,
  mobileOverlay = false,
  onClose,
}: {
  state: ReturnType<typeof useCoachPlanWorkspace>["state"];
  artifactFadeKey: string;
  artifactScrollResetKey: string;
  resolvedBackHref: string | undefined;
  saveStatus: ReturnType<typeof useSavePlan>["saveStatus"];
  saveError: string | null;
  onBackClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  mobileOverlay?: boolean;
  onClose?: () => void;
}) {
  const toolbar = (
    <div className="flex flex-col gap-2">
      <div className="flex shrink-0 items-center gap-2">
        {resolvedBackHref ? (
          <PageBackLink
            href={resolvedBackHref}
            ariaLabel="Back to plan"
            onClick={onBackClick}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <ArtifactToolbar
            title={state.artifactTitle}
            saveDisabled={isChatRunning(state) || !state.currentArtifact}
            saveStatus={saveStatus}
            onTitleChange={onTitleChange}
            onSave={onSave}
            onClose={mobileOverlay ? onClose : undefined}
          />
        </div>
      </div>
      {saveError ? (
        <p className="text-sm text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  );

  const preview = (
    <ArtifactPreview
      artifact={toArtifactPreviewModel(state.currentArtifact)}
      runStatus={state.runStatus}
      phase={state.phase}
      isAwaitingArtifact={false}
      disabled={disabled}
      onPlanChange={onPlanChange}
      embeddedScroll
    />
  );

  const contentInsetClassName = PAGE_CONTENT_INSET_X_CLASS;

  return (
    <FadeIn
      key={artifactFadeKey}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <OverlayScrollChrome
        topChrome={toolbar}
        footerInsetClassName={
          mobileOverlay ? MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS : undefined
        }
        contentInsetClassName={contentInsetClassName}
      >
        {({ scrollPaddingTop, scrollPaddingBottom }) => (
          <ArtifactPanelScrollLane
            scrollResetKey={artifactScrollResetKey}
            scrollPaddingTop={scrollPaddingTop}
            scrollPaddingBottom={scrollPaddingBottom}
            contentInsetClassName={contentInsetClassName}
          >
            {preview}
          </ArtifactPanelScrollLane>
        )}
      </OverlayScrollChrome>
    </FadeIn>
  );
}

export function CoachWorkspace(
  props: {
    firstName: string;
    role: UserRole;
    planId?: string;
    initialPlan?: WorkoutPlan;
    initialSession?: {
      id: string;
      snapshot: CoachWorkspaceSnapshot;
      createdAt: string;
      updatedAt: string;
    };
    stripPlanIdOnClear?: boolean;
    promptEnabled?: boolean;
  },
) {
  const catchUp = useCoachEveCatchUp(props.initialSession);

  useEffect(() => {
    if (!props.initialSession || catchUp.loadPhase !== "ready") {
      return;
    }

    const snapshot = withForgeSessionId(
      props.initialSession.id,
      props.initialSession.snapshot,
    );
    const eve = snapshot.eve;

    if (!eve?.sessionId) {
      return;
    }

    const persisted = getPersistedEveEvents(snapshot);
    const replayAdvanced =
      catchUp.events.length > persisted.length ||
      (persisted.length > 0 &&
        !isTurnComplete(persisted) &&
        isTurnComplete(catchUp.events));
    const needsMarker =
      catchUp.finalizeReason === "stopped" ||
      catchUp.finalizeReason === "interrupted";

    if (!replayAdvanced && !needsMarker) {
      return;
    }

    void saveSessionSnapshot(
      props.initialSession.id,
      buildPersistedCoachSnapshot({
        forgeSessionId: props.initialSession.id,
        title: snapshot.title,
        session: toEveSessionState(eve, catchUp.events.length),
        events: catchUp.events,
        lastTurn:
          !isTurnComplete(catchUp.events) && catchUp.finalizeReason
            ? {
                status:
                  catchUp.finalizeReason === "stopped"
                    ? "stopped"
                    : "interrupted",
                eventCount: catchUp.events.length,
              }
            : null,
      }),
    );
  }, [
    catchUp.events,
    catchUp.finalizeReason,
    catchUp.loadPhase,
    props.initialSession,
  ]);

  if (isCoachEveSessionLoading(catchUp.loadPhase)) {
    return <CoachSessionLoadingView />;
  }

  if (catchUp.loadPhase === "error") {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center p-6"
        role="alert"
      >
        <p className="text-sm text-surface-muted">{catchUp.errorMessage}</p>
      </div>
    );
  }

  const sessionKey = props.initialSession?.id ?? "coach-home";
  const resuming = catchUp.loadPhase === "resuming";

  return (
    <CoachWorkspaceInner
      // Remount when the live tail settles so the Eve agent store is always
      // created from a complete, consistent event log.
      key={`${sessionKey}:${resuming ? "resuming" : "settled"}`}
      {...props}
      syncedEvents={catchUp.events}
      resuming={resuming}
      initialFinalizeReason={resuming ? null : catchUp.finalizeReason}
      onStopResuming={catchUp.stopResuming}
    />
  );
}

function CoachWorkspaceInner({
  firstName,
  role,
  planId: initialPlanId,
  initialPlan,
  initialSession,
  syncedEvents = [],
  resuming = false,
  initialFinalizeReason = null,
  onStopResuming,
  stripPlanIdOnClear = false,
  promptEnabled = true,
}: {
  firstName: string;
  role: UserRole;
  planId?: string;
  initialPlan?: WorkoutPlan;
  initialSession?: {
    id: string;
    snapshot: CoachWorkspaceSnapshot;
    createdAt: string;
    updatedAt: string;
  };
  syncedEvents?: readonly HandleMessageStreamEvent[];
  resuming?: boolean;
  initialFinalizeReason?: TurnFinalizeReason | null;
  onStopResuming?: () => void;
  stripPlanIdOnClear?: boolean;
  promptEnabled?: boolean;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const sessionNavigation = useOptionalSessionNavigation();
  const [showArtifact, setShowArtifact] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const openArtifactOnMobileRef = useRef(Boolean(initialPlan));
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [backlinkPlanId, setBacklinkPlanId] = useState<string | null>(
    initialPlanId ?? null,
  );
  const initialSavedSnapshot =
    initialPlan != null && initialPlanId
      ? createPlanSnapshot(initialPlan, initialPlan.name)
      : null;
  const savedSnapshotRef = useRef<string | null>(initialSavedSnapshot);
  const sessionIdRef = useRef("");

  const handleThreadBound = useCallback(
    ({
      sessionId,
      title,
    }: {
      sessionId: string;
      title: string | null;
    }) => {
      sessionNavigation?.registerNewSession({
        id: sessionId,
        title: title?.trim() || "New conversation",
        updatedAt: new Date().toISOString(),
      });
    },
    [sessionNavigation],
  );

  const handleSessionUrlNavigate = useCallback((sessionId: string) => {
    // Keep the live Eve stream on the current workspace instance. A hard
    // router navigation would remount, abort the turn, and replay from DB.
    syncCoachSessionUrl(sessionId);
  }, []);

  const handleArtifactCleared = useCallback(() => {
    savedSnapshotRef.current = null;
    setShowArtifact(false);
    setIsChatCollapsed(false);
    setBacklinkPlanId(null);
    if (stripPlanIdOnClear) {
      syncCoachWorkspaceUrl({
        sessionId: sessionIdRef.current,
        planId: null,
      });
    }
  }, [stripPlanIdOnClear]);

  const {
    state,
    attachFiles,
    removeAttachment,
    sendMessage,
    stopResponse,
    setArtifactTitle,
    setPlanId,
    setArtifact,
    restart,
  } = useCoachPlanWorkspace(
    initialPlan
      ? {
          initialPlan,
          planId: initialPlanId,
          onArtifactCleared: handleArtifactCleared,
          onThreadInitialized: handleThreadBound,
          onSessionUrlNavigate: handleSessionUrlNavigate,
        }
      : initialSession
        ? {
            initialSession: {
              id: initialSession.id,
              snapshot: initialSession.snapshot,
            },
            syncedEvents,
            resuming,
            initialFinalizeReason,
            onStopResuming,
            onArtifactCleared: handleArtifactCleared,
          }
        : {
            onArtifactCleared: handleArtifactCleared,
            onThreadInitialized: handleThreadBound,
            onSessionUrlNavigate: handleSessionUrlNavigate,
          },
  );

  useEffect(() => {
    sessionIdRef.current = state.sessionId;
  }, [state.sessionId]);

  useEffect(() => {
    if (!openArtifactOnMobileRef.current || !isMobile) {
      return;
    }

    setShowArtifact(true);
    openArtifactOnMobileRef.current = false;
  }, [isMobile]);

  const activePlanId = state.planId;
  const resolvedBackPlanId = backlinkPlanId ?? activePlanId;
  const resolvedBackHref = resolvedBackPlanId
    ? `/coach/plans/${resolvedBackPlanId}`
    : undefined;

  const { saveStatus, saveError, savePlan, resetSaveStatus } =
    useSavePlan(activePlanId, {
      initialStatus: initialSavedSnapshot ? "saved" : undefined,
    });

  const showSplitPane = Boolean(state.currentArtifact);
  const chatCollapsed = showSplitPane && isChatCollapsed;
  const artifactFadeKey = activePlanId ?? state.sessionId;
  const artifactScrollResetKey = state.currentArtifact
    ? `${artifactFadeKey}:${artifactStructureKey(state.currentArtifact)}`
    : "0";

  const toggleChatCollapsed = useCallback(() => {
    setIsChatCollapsed((current) => !current);
  }, []);

  const handleSendMessage = useCallback(
    async (...args: Parameters<typeof sendMessage>) => {
      if (activePlanId) {
        resetSaveStatus();
      }

      await sendMessage(...args);
    },
    [activePlanId, resetSaveStatus, sendMessage],
  );

  const handlePlanChange = useCallback(
    (plan: WorkoutPlan) => {
      setArtifact(plan);
      resetSaveStatus();
    },
    [resetSaveStatus, setArtifact],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      setArtifactTitle(title);
      resetSaveStatus();
    },
    [resetSaveStatus, setArtifactTitle],
  );

  const handleSave = useCallback(async () => {
    if (!state.currentArtifact || isChatRunning(state)) {
      return;
    }

    const result = await savePlan({
      plan: state.currentArtifact,
      title: state.artifactTitle,
    });

    if (!result) {
      return;
    }

    if (!activePlanId) {
      setPlanId(result.planId);
      setBacklinkPlanId(result.planId);
      syncCoachWorkspaceUrl({
        sessionId: state.sessionId,
        planId: result.planId,
      });
    }

    savedSnapshotRef.current = createPlanSnapshot(
      state.currentArtifact,
      state.artifactTitle,
    );
  }, [activePlanId, savePlan, setPlanId, state]);

  const handleBackClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!savedSnapshotRef.current) {
        return;
      }

      if (
        hasUnsavedPlanChanges(
          { plan: state.currentArtifact, title: state.artifactTitle },
          savedSnapshotRef.current,
        ) &&
        !window.confirm("You have unsaved changes. Leave without saving?")
      ) {
        event.preventDefault();
      }
    },
    [state.artifactTitle, state.currentArtifact],
  );

  const handleClose = useCallback(() => {
    if (
      savedSnapshotRef.current &&
      hasUnsavedPlanChanges(
        { plan: state.currentArtifact, title: state.artifactTitle },
        savedSnapshotRef.current,
      ) &&
      !window.confirm("You have unsaved changes. Leave without saving?")
    ) {
      return;
    }

    if (backlinkPlanId ?? activePlanId) {
      router.push(`/coach/plans/${backlinkPlanId ?? activePlanId}`);
      return;
    }

    restart();
    savedSnapshotRef.current = null;
    setShowArtifact(false);
    navigateToCoachHome(router);
  }, [activePlanId, backlinkPlanId, restart, router, state]);

  const handleActiveSessionDeleted = useCallback(() => {
    restart();
    setMobileHistoryOpen(false);
  }, [restart]);

  const toggleMobileHistory = useCallback(() => {
    setMobileHistoryOpen((current) => !current);
  }, []);

  const closeMobileHistory = useCallback(() => {
    setMobileHistoryOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const mobileHistoryToggle = isMobile ? (
    <SessionHistoryMobileToggle
      open={mobileHistoryOpen}
      onToggle={toggleMobileHistory}
    />
  ) : null;

  const mobileHistoryPanel = isMobile ? (
    <SessionHistoryMobilePanel
      onActiveSessionDeleted={handleActiveSessionDeleted}
      onClose={closeMobileHistory}
    />
  ) : null;

  const mobileChatHeaderClass =
    "flex shrink-0 items-center justify-between pb-2";

  const renderMobileChatBody = (
    composerHeader?: ReactNode,
    options?: { showAttachmentsAboveComposer?: boolean },
  ) =>
    mobileHistoryOpen ? (
      <div className={MOBILE_HISTORY_OVERLAY_CLASS}>
        {mobileHistoryPanel}
      </div>
    ) : (
      <CoachConversationPanel
        topChrome={mobileHistoryToggle}
        state={state}
        onAttach={attachFiles}
        onRemoveAttachment={removeAttachment}
        onSend={handleSendMessage}
        onStop={stopResponse}
        onReset={handleReset}
        promptEnabled={promptEnabled}
        composerClassName={MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}
        composerHeader={composerHeader}
        showAttachmentsAboveComposer={options?.showAttachmentsAboveComposer}
      />
    );

  if (!state.hasStarted) {
    if (isMobile) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={`${mobileChatHeaderClass} ${MOBILE_WORKSPACE_X_PADDING_CLASS}`}>
            {mobileHistoryToggle}
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {mobileHistoryOpen ? (
              <div className={MOBILE_HISTORY_OVERLAY_CLASS}>
                <SessionHistoryMobilePanel
                  onActiveSessionDeleted={handleActiveSessionDeleted}
                  onClose={closeMobileHistory}
                  className="px-3"
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-surface-foreground">
                  Welcome back,{" "}
                  <span className={roleLinkClass(role)}>{firstName}</span>
                </h1>
              </div>
            )}
          </div>
          {!mobileHistoryOpen ? (
            <div
              className={`shrink-0 px-4 pt-2 ${MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}`}
            >
              <ChatComposer
                overlayChrome
                compact
                state={state}
                composerKey={`${state.sessionId}-${state.messages.length}`}
                onAttach={attachFiles}
                onRemoveAttachment={removeAttachment}
                onSend={handleSendMessage}
                onStop={stopResponse}
                promptEnabled={promptEnabled}
              />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 text-center md:px-6">
        <div className="flex w-full items-center justify-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-surface-foreground">
            Welcome back,{" "}
            <span className={roleLinkClass(role)}>{firstName}</span>
          </h1>
        </div>

        <ChatComposer
          overlayChrome
          compact
          state={state}
          composerKey={`${state.sessionId}-${state.messages.length}`}
          onAttach={attachFiles}
          onRemoveAttachment={removeAttachment}
          onSend={handleSendMessage}
          onStop={stopResponse}
          promptEnabled={promptEnabled}
        />
      </div>
    );
  }

  if (isMobile) {
    if (!showSplitPane) {
      return (
        <ChatWorkspaceShell>{renderMobileChatBody()}</ChatWorkspaceShell>
      );
    }

    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {showArtifact ? (
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <ArtifactPanel
                state={state}
                artifactFadeKey={artifactFadeKey}
                artifactScrollResetKey={artifactScrollResetKey}
                resolvedBackHref={resolvedBackHref}
                saveStatus={saveStatus}
                saveError={saveError}
                onBackClick={handleBackClick}
                onTitleChange={handleTitleChange}
                onSave={handleSave}
                disabled={isChatRunning(state)}
                onPlanChange={handlePlanChange}
                mobileOverlay
                onClose={() => setShowArtifact(false)}
              />
            </div>
        ) : (
          <ChatWorkspaceShell>
            {renderMobileChatBody(
              <MobileComposerToolbar
                attachments={state.attachments}
                onRemoveAttachment={removeAttachment}
                trailing={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    icon={<EyeIcon />}
                    aria-label="View artifact"
                    onClick={() => setShowArtifact(true)}
                  >
                    View
                  </Button>
                }
              />,
              { showAttachmentsAboveComposer: false },
            )}
          </ChatWorkspaceShell>
        )}
      </div>
    );
  }

  const desktopChatToggle = showSplitPane ? (
    <IconButton
      variant="plain"
      size="sm"
      icon={<SidebarToggleIcon />}
      aria-label={chatCollapsed ? "Expand chat" : "Collapse chat"}
      aria-expanded={!chatCollapsed}
      onClick={toggleChatCollapsed}
    />
  ) : null;

  return (
    <div
      className={`relative flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-h-0 flex-1 flex-col overflow-hidden max-md:mx-4`}
    >
      <div
        className={`@container grid ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-h-0 flex-1 grid-rows-1 overflow-hidden ${DESKTOP_CHAT_GRID_TRANSITION_CLASS}${
          showSplitPane ? "" : " mx-auto w-full max-w-3xl"
        }`}
        style={{
          gridTemplateColumns: showSplitPane
            ? chatCollapsed
              ? `1fr ${DESKTOP_CHAT_COLLAPSED_WIDTH}`
              : DESKTOP_SPLIT_GRID_COLUMNS_EXPANDED
            : "1fr",
        }}
      >
        <div
          className={
            showSplitPane
              ? `flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-w-0 flex-col overflow-hidden max-md:pb-4 ${DESKTOP_ARTIFACT_COLUMN_CLASS}`
              : "hidden"
          }
        >
          {showSplitPane ? (
            <div className={`overflow-hidden ${DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS}`}>
                <ArtifactPanel
                  state={state}
                  artifactFadeKey={artifactFadeKey}
                  artifactScrollResetKey={artifactScrollResetKey}
                  resolvedBackHref={resolvedBackHref}
                  saveStatus={saveStatus}
                  saveError={saveError}
                  onBackClick={handleBackClick}
                  onTitleChange={handleTitleChange}
                  onSave={handleSave}
                  disabled={isChatRunning(state)}
                  onPlanChange={handlePlanChange}
                />
            </div>
          ) : null}
        </div>

        <div
          className={`flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-w-0 flex-col overflow-hidden max-md:pb-4 ${
            showSplitPane
              ? chatCollapsed
                ? DESKTOP_CHAT_COLLAPSED_RAIL_CLASS
                : DESKTOP_CHAT_COLUMN_CLASS
              : "w-full"
          }`}
        >
          {chatCollapsed ? (
            desktopChatToggle
          ) : (
            <>
              {desktopChatToggle ? (
                <div className={DESKTOP_CHAT_TOGGLE_ROW_CLASS}>{desktopChatToggle}</div>
              ) : null}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <CoachConversationPanel
                  state={state}
                  onAttach={attachFiles}
                  onRemoveAttachment={removeAttachment}
                  onSend={handleSendMessage}
                  onStop={stopResponse}
                  onReset={handleReset}
                  promptEnabled={promptEnabled}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
