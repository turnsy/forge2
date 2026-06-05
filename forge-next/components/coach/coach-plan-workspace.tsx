"use client";

import { PlanChatComposer } from "@/components/coach/plan-chat/plan-chat-composer";
import { PlanChatPreview } from "@/components/coach/plan-chat/plan-chat-preview";
import { PlanChatThread } from "@/components/coach/plan-chat/plan-chat-thread";
import { PlanWorkspaceToolbar } from "@/components/coach/plan-chat/plan-workspace-toolbar";
import { ResizableSplitPane } from "@/components/coach/resizable-split-pane";
import { isAwaitingFirstPlan, isChatRunning } from "@/lib/plan-chat";
import { usePlanChatWorkspace } from "@/lib/plan-chat/use-plan-chat-workspace";
import type { UserRole } from "@/lib/auth/types";
import type { PromptMentionItem } from "@/lib/prompts/mention-types";
import { roleLinkClass } from "@/lib/theme";

export function CoachPlanWorkspace({
  firstName,
  role,
  mentionItems,
}: {
  firstName: string;
  role: UserRole;
  mentionItems: PromptMentionItem[];
}) {
  const { state, attachFiles, sendMessage, setPlanTitle, restart } =
    usePlanChatWorkspace();

  if (!state.hasStarted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 text-center md:px-6">
        <div className="flex w-full items-center justify-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-surface-foreground">
            Welcome back,{" "}
            <span className={roleLinkClass(role)}>{firstName}</span>
          </h1>
        </div>

        <PlanChatComposer
          state={state}
          mentionItems={mentionItems}
          composerKey={`${state.draftId}-${state.messages.length}`}
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
            <PlanWorkspaceToolbar
              planTitle={state.planTitle}
              saveDisabled={isChatRunning(state)}
              onPlanTitleChange={setPlanTitle}
            />
            <div className="min-h-0 flex-1 overflow-hidden px-2">
              <PlanChatPreview
                plan={state.currentArtifact}
                runStatus={state.runStatus}
                isAwaitingPlan={isAwaitingFirstPlan(state)}
              />
            </div>
          </div>
        }
        right={
          <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 pt-4 pb-4 md:px-5 md:pt-5">
            <PlanChatThread
              messages={state.messages}
              streamingAssistantText={state.streamingAssistantText}
              runStatus={state.runStatus}
              errors={state.errors}
              phase={state.phase}
              onRestart={restart}
              restartDisabled={isChatRunning(state)}
            />
            <div className="shrink-0 border-t border-glass-border p-2">
              <PlanChatComposer
                compact
                state={state}
                mentionItems={mentionItems}
                composerKey={`${state.draftId}-${state.messages.length}`}
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
