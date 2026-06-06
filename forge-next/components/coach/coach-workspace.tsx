"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import { ArtifactToolbar } from "@/components/artifact/artifact-toolbar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { ResizableSplitPane } from "@/components/ui/resizable-split-pane";
import { isAwaitingFirstArtifact, isChatRunning } from "@/lib/chat";
import { toArtifactPreviewModel } from "@/lib/chat/adapters/plan/artifact-preview";
import { useCoachPlanWorkspace } from "@/lib/chat/adapters/plan/use-coach-plan-workspace";
import type { UserRole } from "@/lib/auth/types";
import { useSavePlan } from "@/lib/plans/use-save-plan";
import { roleLinkClass } from "@/lib/theme";

export function CoachWorkspace({
  firstName,
  role,
}: {
  firstName: string;
  role: UserRole;
}) {
  const router = useRouter();
  const { state, attachFiles, sendMessage, setArtifactTitle, restart } =
    useCoachPlanWorkspace();
  const { isSaving, saveError, savePlan } = useSavePlan(null);

  const handleSave = useCallback(async () => {
    if (!state.currentArtifact || isChatRunning(state)) {
      return;
    }

    const result = await savePlan({
      plan: state.currentArtifact,
      title: state.artifactTitle,
    });

    if (result) {
      router.push(`/coach/plans/${result.planId}`);
    }
  }, [router, savePlan, state]);

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
          onSend={sendMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ResizableSplitPane
        left={
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-2 pt-4 pb-4 md:px-5 md:pt-5">
            <ArtifactToolbar
              title={state.artifactTitle}
              saveDisabled={isChatRunning(state) || !state.currentArtifact}
              saveLoading={isSaving}
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
                isAwaitingArtifact={isAwaitingFirstArtifact(state)}
              />
            </div>
          </div>
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
                onSend={sendMessage}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
