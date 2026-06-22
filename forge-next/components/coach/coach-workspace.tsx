"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";
import { SessionHistoryMobileToggle } from "@/components/coach/session-history-mobile";
import { SessionHistoryMobilePanel } from "@/components/coach/session-history-mobile-panel";
import { CoachConversationPanel } from "@/components/coach/coach-conversation-panel";
import { WorkspaceCloseButton } from "@/components/coach/workspace-close-button";
import { ChatComposer } from "@/components/chat/chat-composer";
import { EyeIcon } from "@/components/icons/eye-icon";
import { Button, FadeIn, PageBackLink } from "@/components/ui";
import {
  DESKTOP_CHAT_AREA_CLASS,
  DESKTOP_CHAT_COLUMN_CLASS,
  DESKTOP_CHAT_HEADER_CLASS,
  DESKTOP_WORKSPACE_HEIGHT_CLASS,
} from "@/lib/coach/desktop-workspace-layout";
import {
  MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS,
  MOBILE_OVERLAY_CLOSE_CLASS,
  MOBILE_OVERLAY_CONTENT_CLASS,
  MOBILE_VIEW_ARTIFACT_SPACING_CLASS,
  MOBILE_WORKSPACE_X_PADDING_CLASS,
} from "@/lib/coach/mobile-workspace-layout";
import { isChatRunning } from "@/lib/chat";
import { toArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import { syncCoachWorkspaceUrl } from "@/lib/chat/session-url";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useSavePlan } from "@/lib/plans/use-save-plan";
import {
  createPlanSnapshot,
  hasUnsavedPlanChanges,
} from "@/lib/plans/snapshot";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { roleLinkClass, pageShellClass } from "@/lib/theme";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

function ChatWorkspaceShell({
  state,
  onReset,
  children,
  headerClassName,
  className = "",
  headerStart,
}: {
  state: PlanWorkspaceState;
  onReset: () => void;
  children: ReactNode;
  headerClassName: string;
  className?: string;
  headerStart?: ReactNode;
}) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}>
      <div className={headerClassName}>
        {headerStart ?? <span />}
        <WorkspaceCloseButton
          variant="reset"
          disabled={isChatRunning(state)}
          onClick={onReset}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function ArtifactPanel({
  state,
  artifactFadeKey,
  resolvedBackHref,
  saveStatus,
  saveError,
  onBackClick,
  onTitleChange,
  onSave,
  disabled,
  onPlanChange,
}: {
  state: ReturnType<typeof useCoachPlanWorkspace>["state"];
  artifactFadeKey: string;
  resolvedBackHref: string | undefined;
  saveStatus: ReturnType<typeof useSavePlan>["saveStatus"];
  saveError: string | null;
  onBackClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
}) {
  return (
    <FadeIn
      key={artifactFadeKey}
      className="flex h-full min-h-0 flex-col gap-5 overflow-hidden max-md:gap-4"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden max-md:gap-4">
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
            />
          </div>
        </div>
        {saveError ? (
          <p className="text-sm text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ArtifactPreview
            artifact={toArtifactPreviewModel(state.currentArtifact)}
            runStatus={state.runStatus}
            isAwaitingArtifact={false}
            disabled={disabled}
            onPlanChange={onPlanChange}
          />
        </div>
      </div>
    </FadeIn>
  );
}

export function CoachWorkspace({
  firstName,
  role,
  planId: initialPlanId,
  initialPlan,
  initialSession,
  stripPlanIdOnClear = false,
  promptEnabled = true,
}: {
  firstName: string;
  role: UserRole;
  planId?: string;
  initialPlan?: WorkoutPlan;
  initialSession?: {
    id: string;
    snapshot: ChatSessionSnapshot;
    createdAt: string;
    updatedAt: string;
  };
  stripPlanIdOnClear?: boolean;
  promptEnabled?: boolean;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showArtifact, setShowArtifact] = useState(() => {
    if (!initialPlan || !initialPlanId || typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 767px)").matches;
  });
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const initialSavedSnapshot =
    initialPlan != null
      ? createPlanSnapshot(initialPlan, initialPlan.name)
      : initialSession?.snapshot.planId && initialSession.snapshot.currentArtifact
        ? createPlanSnapshot(
            initialSession.snapshot.currentArtifact,
            initialSession.snapshot.artifactTitle,
          )
        : null;
  const savedSnapshotRef = useRef<string | null>(initialSavedSnapshot);
  const sessionIdRef = useRef("");

  const shouldSyncSessionUrl = !initialPlanId && !initialSession;

  const handleArtifactCleared = useCallback(() => {
    savedSnapshotRef.current = null;
    setShowArtifact(false);
    if (stripPlanIdOnClear) {
      syncCoachWorkspaceUrl({
        sessionId: sessionIdRef.current,
        planId: null,
      });
    }
  }, [stripPlanIdOnClear]);

  const handleSessionPersisted = useCallback((sessionId: string) => {
    syncCoachWorkspaceUrl({ sessionId });
  }, []);

  const {
    state,
    attachFiles,
    sendMessage,
    setArtifactTitle,
    setPlanId,
    setArtifact,
    restart,
  } = useCoachPlanWorkspace(
    initialPlan && initialPlanId
      ? {
          initialPlan,
          planId: initialPlanId,
          onArtifactCleared: handleArtifactCleared,
        }
      : initialSession
        ? {
            initialSession: {
              id: initialSession.id,
              snapshot: initialSession.snapshot,
            },
            onArtifactCleared: handleArtifactCleared,
          }
        : {
            onArtifactCleared: handleArtifactCleared,
            onSessionPersisted: shouldSyncSessionUrl
              ? handleSessionPersisted
              : undefined,
          },
  );

  useEffect(() => {
    sessionIdRef.current = state.sessionId;
  }, [state.sessionId]);

  const activePlanId = state.planId;
  const resolvedBackHref = activePlanId
    ? `/coach/plans/${activePlanId}`
    : undefined;

  const { saveStatus, saveError, savePlan, resetSaveStatus } =
    useSavePlan(activePlanId, {
      initialStatus: initialSavedSnapshot ? "saved" : undefined,
    });

  const showSplitPane = Boolean(state.currentArtifact);

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
    if (isChatRunning(state)) {
      return;
    }

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

    if (activePlanId) {
      router.push(`/coach/plans/${activePlanId}`);
      return;
    }

    router.replace("/coach");
    router.refresh();
  }, [activePlanId, router, state]);

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

  const handleMobileReset = useCallback(() => {
    if (mobileHistoryOpen) {
      setMobileHistoryOpen(false);
      return;
    }

    handleClose();
  }, [handleClose, mobileHistoryOpen]);

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

  const mobileComposer = (
    <ChatComposer
      compact={state.hasStarted}
      state={state}
      composerKey={`${state.sessionId}-${state.messages.length}`}
      onAttach={attachFiles}
      onSend={handleSendMessage}
      promptEnabled={promptEnabled}
    />
  );

  const renderMobileChatBody = (
    composerHeader?: ReactNode,
  ) =>
    mobileHistoryOpen ? (
      <>
        {mobileHistoryPanel}
        <div
          className={`shrink-0 pt-2 ${MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}`}
        >
          {composerHeader}
          {mobileComposer}
        </div>
      </>
    ) : (
      <CoachConversationPanel
        state={state}
        onAttach={attachFiles}
        onSend={handleSendMessage}
        promptEnabled={promptEnabled}
        composerClassName={MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}
        composerHeader={composerHeader}
      />
    );

  if (!state.hasStarted) {
    if (isMobile) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={`${mobileChatHeaderClass} ${MOBILE_WORKSPACE_X_PADDING_CLASS}`}>
            {mobileHistoryToggle}
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {mobileHistoryOpen ? (
              <SessionHistoryMobilePanel
                onActiveSessionDeleted={handleActiveSessionDeleted}
                onClose={closeMobileHistory}
                className="px-3"
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-surface-foreground">
                  Welcome back,{" "}
                  <span className={roleLinkClass(role)}>{firstName}</span>
                </h1>
              </div>
            )}
          </div>
          <div
            className={`shrink-0 px-4 pt-2 ${MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}`}
          >
            <ChatComposer
              state={state}
              composerKey={`${state.sessionId}-${state.messages.length}`}
              onAttach={attachFiles}
              onSend={handleSendMessage}
              promptEnabled={promptEnabled}
            />
          </div>
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
          state={state}
          composerKey={`${state.sessionId}-${state.messages.length}`}
          onAttach={attachFiles}
          onSend={handleSendMessage}
          promptEnabled={promptEnabled}
        />
      </div>
    );
  }

  const artifactFadeKey =
    activePlanId ?? state.sessionId + (state.artifactTitle || "artifact");

  if (isMobile) {
    if (!showSplitPane) {
      return (
        <ChatWorkspaceShell
          state={state}
          onReset={handleMobileReset}
          headerClassName={mobileChatHeaderClass}
          headerStart={mobileHistoryToggle}
          className={MOBILE_WORKSPACE_X_PADDING_CLASS}
        >
          {renderMobileChatBody()}
        </ChatWorkspaceShell>
      );
    }

    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {showArtifact ? (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <WorkspaceCloseButton
              className={MOBILE_OVERLAY_CLOSE_CLASS}
              variant="close"
              ariaLabel="Close artifact"
              onClick={() => setShowArtifact(false)}
            />
            <div
              className={`flex min-h-0 flex-1 flex-col overflow-hidden ${MOBILE_OVERLAY_CONTENT_CLASS} ${MOBILE_WORKSPACE_X_PADDING_CLASS}`}
            >
              <ArtifactPanel
                state={state}
                artifactFadeKey={artifactFadeKey}
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
          </div>
        ) : (
          <ChatWorkspaceShell
            state={state}
            onReset={handleMobileReset}
            headerClassName={mobileChatHeaderClass}
            headerStart={mobileHistoryToggle}
            className={MOBILE_WORKSPACE_X_PADDING_CLASS}
          >
            {renderMobileChatBody(
              <div className={`flex justify-end ${MOBILE_VIEW_ARTIFACT_SPACING_CLASS}`}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  icon={<EyeIcon />}
                  aria-label="View artifact"
                  onClick={() => setShowArtifact(true)}
                >
                  View
                </Button>
              </div>,
            )}
          </ChatWorkspaceShell>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-h-0 flex-1 flex-col overflow-hidden max-md:mx-4`}
    >
      <div
        className={`grid ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-h-0 flex-1 grid-rows-1 overflow-hidden transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none${
          showSplitPane ? "" : " mx-auto w-full max-w-3xl"
        }`}
        style={{
          gridTemplateColumns: showSplitPane
            ? "minmax(320px, 1fr) minmax(280px, 33%)"
            : "1fr",
        }}
      >
        <div
          className={
            showSplitPane
              ? `flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-w-0 flex-col overflow-hidden max-md:pb-4 ${pageShellClass()} !mx-0 !max-w-none`
              : "hidden"
          }
        >
          {showSplitPane ? (
            <ArtifactPanel
              state={state}
              artifactFadeKey={artifactFadeKey}
              resolvedBackHref={resolvedBackHref}
              saveStatus={saveStatus}
              saveError={saveError}
              onBackClick={handleBackClick}
              onTitleChange={handleTitleChange}
              onSave={handleSave}
              disabled={isChatRunning(state)}
              onPlanChange={handlePlanChange}
            />
          ) : null}
        </div>

        <div
          className={`flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-w-0 flex-col overflow-hidden max-md:pb-4 ${
            showSplitPane
              ? `${DESKTOP_CHAT_COLUMN_CLASS} animate-chat-panel-slide`
              : "w-full"
          }`}
        >
          <div
            className={`flex ${DESKTOP_WORKSPACE_HEIGHT_CLASS} min-h-0 flex-1 flex-col overflow-hidden ${DESKTOP_CHAT_AREA_CLASS}`}
          >
            <ChatWorkspaceShell
              state={state}
              onReset={handleMobileReset}
              headerClassName={DESKTOP_CHAT_HEADER_CLASS}
            >
              <CoachConversationPanel
                state={state}
                onAttach={attachFiles}
                onSend={handleSendMessage}
                promptEnabled={promptEnabled}
              />
            </ChatWorkspaceShell>
          </div>
        </div>
      </div>
    </div>
  );
}
