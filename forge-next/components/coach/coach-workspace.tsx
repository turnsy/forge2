"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, type MouseEvent } from "react";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";
import { CoachConversationPanel } from "@/components/coach/coach-conversation-panel";
import { WorkspaceCloseButton } from "@/components/coach/workspace-close-button";
import { ChatComposer } from "@/components/chat/chat-composer";
import { FadeIn, PageBackLink } from "@/components/ui";
import { isChatRunning } from "@/lib/chat";
import { toArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import type { UserRole } from "@/lib/auth/types";
import { useSavePlan } from "@/lib/plans/use-save-plan";
import {
  createPlanSnapshot,
  hasUnsavedPlanChanges,
} from "@/lib/plans/snapshot";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { roleLinkClass } from "@/lib/theme";

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
  const savedSnapshotRef = useRef<string | null>(
    initialPlan ? createPlanSnapshot(initialPlan, initialPlan.name) : null,
  );

  const handleArtifactCleared = useCallback(() => {
    savedSnapshotRef.current = null;
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
            <FadeIn
              key={artifactFadeKey}
              className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-2 md:pr-3"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-3 md:pt-4">
                <div className="flex shrink-0 items-center gap-2">
                  {resolvedBackHref ? (
                    <PageBackLink
                      href={resolvedBackHref}
                      ariaLabel="Back to plan"
                      onClick={handleBackClick}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <ArtifactToolbar
                      title={state.artifactTitle}
                      saveDisabled={
                        isChatRunning(state) || !state.currentArtifact
                      }
                      saveStatus={saveStatus}
                      onTitleChange={setArtifactTitle}
                      onSave={handleSave}
                    />
                  </div>
                </div>
                {saveError ? (
                  <p className="px-2 text-sm text-red-400" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <div className="min-h-0 flex-1 overflow-hidden px-2">
                  <ArtifactPreview
                    artifact={toArtifactPreviewModel(state.currentArtifact)}
                    runStatus={state.runStatus}
                    isAwaitingArtifact={false}
                  />
                </div>
              </div>
            </FadeIn>
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
            className="absolute right-0 top-0 z-20"
            disabled={isChatRunning(state)}
            onClick={handleClose}
          />
          <div className="flex min-h-0 flex-1 flex-col pt-10">
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
