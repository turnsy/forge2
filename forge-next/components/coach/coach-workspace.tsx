"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";
import { CoachConversationPanel } from "@/components/coach/coach-conversation-panel";
import { WorkspaceCloseButton } from "@/components/coach/workspace-close-button";
import { ChatComposer } from "@/components/chat/chat-composer";
import { EyeIcon } from "@/components/icons/eye-icon";
import { Button, FadeIn, PageBackLink } from "@/components/ui";
import {
  MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS,
  MOBILE_BOTTOM_NAV_SCROLL_END_CLASS,
  MOBILE_OVERLAY_CLOSE_CLASS,
  MOBILE_OVERLAY_CONTENT_CLASS,
  MOBILE_VIEW_ARTIFACT_SPACING_CLASS,
  MOBILE_WORKSPACE_X_PADDING_CLASS,
} from "@/lib/coach/mobile-workspace-layout";
import { isChatRunning } from "@/lib/chat";
import { toArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useSavePlan } from "@/lib/plans/use-save-plan";
import {
  createPlanSnapshot,
  hasUnsavedPlanChanges,
} from "@/lib/plans/snapshot";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { roleLinkClass } from "@/lib/theme";

function ArtifactPanel({
  state,
  artifactFadeKey,
  resolvedBackHref,
  saveStatus,
  saveError,
  onBackClick,
  onTitleChange,
  onSave,
}: {
  state: ReturnType<typeof useCoachPlanWorkspace>["state"];
  artifactFadeKey: string;
  resolvedBackHref: string | undefined;
  saveStatus: ReturnType<typeof useSavePlan>["saveStatus"];
  saveError: string | null;
  onBackClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  onTitleChange: (title: string) => void;
  onSave: () => void;
}) {
  return (
    <FadeIn
      key={artifactFadeKey}
      className="flex h-full min-h-0 flex-col gap-5 overflow-hidden md:gap-4 md:pr-3"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden md:gap-4 md:pt-4">
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
          <p className="px-2 text-sm text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}
        <div
          className={`min-h-0 flex-1 md:overflow-hidden md:px-2 ${MOBILE_BOTTOM_NAV_SCROLL_END_CLASS} max-md:overflow-y-auto max-md:px-0`}
        >
          <ArtifactPreview
            artifact={toArtifactPreviewModel(state.currentArtifact)}
            runStatus={state.runStatus}
            isAwaitingArtifact={false}
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
  stripPlanIdOnClear = false,
}: {
  firstName: string;
  role: UserRole;
  planId?: string;
  initialPlan?: WorkoutPlan;
  stripPlanIdOnClear?: boolean;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showArtifact, setShowArtifact] = useState(false);
  const savedSnapshotRef = useRef<string | null>(
    initialPlan ? createPlanSnapshot(initialPlan, initialPlan.name) : null,
  );

  const handleArtifactCleared = useCallback(() => {
    savedSnapshotRef.current = null;
    setShowArtifact(false);
    if (stripPlanIdOnClear) {
      router.replace("/coach");
    }
  }, [router, stripPlanIdOnClear]);

  const {
    state,
    attachFiles,
    sendMessage,
    setArtifactTitle,
    setPlanId,
    restart,
  } = useCoachPlanWorkspace(
    initialPlan && initialPlanId
      ? {
          initialPlan,
          planId: initialPlanId,
          onArtifactCleared: handleArtifactCleared,
        }
      : { onArtifactCleared: handleArtifactCleared },
  );

  const activePlanId = state.planId;
  const resolvedBackHref = activePlanId
    ? `/coach/plans/${activePlanId}`
    : undefined;

  const { saveStatus, saveError, savePlan, resetSaveStatus } =
    useSavePlan(activePlanId);

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
      router.replace(`/coach?planId=${result.planId}`);
    }

    savedSnapshotRef.current = createPlanSnapshot(
      state.currentArtifact,
      state.artifactTitle,
    );
  }, [activePlanId, router, savePlan, setPlanId, state]);

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

    restart();
  }, [activePlanId, restart, router, state]);

  if (!state.hasStarted) {
    if (isMobile) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-surface-foreground">
              Welcome back,{" "}
              <span className={roleLinkClass(role)}>{firstName}</span>
            </h1>
          </div>
          <div
            className={`shrink-0 px-4 pt-2 ${MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}`}
          >
            <ChatComposer
              state={state}
              composerKey={`${state.sessionId}-${state.messages.length}`}
              onAttach={attachFiles}
              onSend={handleSendMessage}
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
        />
      </div>
    );
  }

  const artifactFadeKey =
    activePlanId ?? state.sessionId + (state.artifactTitle || "artifact");

  if (isMobile && showSplitPane) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {showArtifact ? (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <WorkspaceCloseButton
              className={MOBILE_OVERLAY_CLOSE_CLASS}
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
                onTitleChange={setArtifactTitle}
                onSave={handleSave}
              />
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <WorkspaceCloseButton
              className={MOBILE_OVERLAY_CLOSE_CLASS}
              disabled={isChatRunning(state)}
              onClick={handleClose}
            />
            <div
              className={`flex min-h-0 flex-1 flex-col ${MOBILE_OVERLAY_CONTENT_CLASS} ${MOBILE_WORKSPACE_X_PADDING_CLASS}`}
            >
              <CoachConversationPanel
                state={state}
                onAttach={attachFiles}
                onSend={handleSendMessage}
                composerClassName={MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS}
                composerHeader={
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
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-4 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={`grid min-h-0 flex-1 overflow-hidden transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none${
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
              ? "min-h-0 min-w-0 overflow-hidden pb-4 md:pb-5"
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
              onTitleChange={setArtifactTitle}
              onSave={handleSave}
            />
          ) : null}
        </div>

        <div
          className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden px-2 pb-4 md:px-3 md:pb-5 ${
            showSplitPane
              ? "animate-chat-panel-slide border-l border-glass-border"
              : "w-full"
          }`}
        >
          <WorkspaceCloseButton
            className="absolute right-0 top-2 z-20"
            disabled={isChatRunning(state)}
            onClick={handleClose}
          />
          <div className={`flex min-h-0 flex-1 flex-col ${MOBILE_OVERLAY_CONTENT_CLASS}`}>
            <CoachConversationPanel
              state={state}
              onAttach={attachFiles}
              onSend={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
