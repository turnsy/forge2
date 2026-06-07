"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, type MouseEvent } from "react";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";
import { CenteredChatLayout } from "@/components/coach/centered-chat-layout";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { PageBackGutter } from "@/components/ui";
import { ResizableSplitPane } from "@/components/ui/resizable-split-pane";
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
import { pageBackGutterReserveClass, roleLinkClass } from "@/lib/theme";

export type CoachWorkspaceMode = "create" | "edit";

export function CoachWorkspace({
  firstName,
  role,
  mode = "create",
  planId,
  initialPlan,
  backHref,
}: {
  firstName: string;
  role: UserRole;
  mode?: CoachWorkspaceMode;
  planId?: string;
  initialPlan?: WorkoutPlan;
  backHref?: string;
}) {
  const router = useRouter();
  const savedSnapshotRef = useRef<string | null>(
    mode === "edit" && initialPlan
      ? createPlanSnapshot(initialPlan, initialPlan.name)
      : null,
  );
  const { state, attachFiles, sendMessage, setArtifactTitle, restart } =
    useCoachPlanWorkspace(
      mode === "edit" && initialPlan
        ? { initialPlan, planId }
        : undefined,
    );
  const { saveStatus, saveError, savePlan, resetSaveStatus } = useSavePlan(
    mode === "edit" ? (planId ?? null) : null,
  );

  const showSplitPane = Boolean(state.currentArtifact);

  const handleSendMessage = useCallback(
    async (...args: Parameters<typeof sendMessage>) => {
      if (mode === "edit") {
        resetSaveStatus();
      }

      await sendMessage(...args);
    },
    [mode, resetSaveStatus, sendMessage],
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

    if (mode === "create") {
      router.push(`/coach/plans/${result.planId}`);
      return;
    }

    savedSnapshotRef.current = createPlanSnapshot(
      state.currentArtifact,
      state.artifactTitle,
    );
  }, [mode, router, savePlan, state]);

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

  if (!showSplitPane) {
    return (
      <div className="flex mt-2 mx-4 min-h-0 flex-1 flex-col overflow-hidden">
        <CenteredChatLayout
          state={state}
          onAttach={attachFiles}
          onSend={handleSendMessage}
          onRestart={restart}
        />
      </div>
    );
  }

  const previewPane = (
    <>
      <ArtifactToolbar
        title={state.artifactTitle}
        saveDisabled={isChatRunning(state) || !state.currentArtifact}
        saveStatus={saveStatus}
        onTitleChange={setArtifactTitle}
        onSave={handleSave}
      />
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
    </>
  );

  return (
    <div className="flex mt-2 mx-4 min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden transition-[padding] duration-300">
      <ResizableSplitPane
        left={
          mode === "edit" && backHref ? (
            <div
              className={`flex h-full min-h-0 flex-col overflow-x-visible overflow-y-hidden ${pageBackGutterReserveClass()} pr-2 pb-4 pt-4 md:pr-5 md:pb-5 md:pt-5`}
            >
              <PageBackGutter
                back={{
                  href: backHref,
                  ariaLabel: "Back to plan",
                  onClick: handleBackClick,
                }}
                backAlignClassName="top-0 h-10 items-center"
                className="min-h-0 flex-1"
                contentClassName="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
              >
                {previewPane}
              </PageBackGutter>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-2 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
              {previewPane}
            </div>
          )
        }
        right={
          <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 pt-4 pb-4 md:px-5 md:pt-5">
            <ChatThread
              messages={state.messages}
              streamingAssistantText={state.streamingAssistantText}
              runStatus={state.runStatus}
              errors={state.errors}
              phase={state.phase}
              onRestart={restart}
              restartDisabled={isChatRunning(state)}
            />
            <div className="shrink-0 border-t border-glass-border p-2">
              <ChatComposer
                compact
                state={state}
                composerKey={`${state.sessionId}-${state.messages.length}`}
                onAttach={attachFiles}
                onSend={handleSendMessage}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
