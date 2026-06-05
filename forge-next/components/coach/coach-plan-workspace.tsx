"use client";

import { PlanChatComposer } from "@/components/coach/plan-chat/plan-chat-composer";
import { PlanChatPreview } from "@/components/coach/plan-chat/plan-chat-preview";
import { PlanChatThread } from "@/components/coach/plan-chat/plan-chat-thread";
import { ResizableSplitPane } from "@/components/coach/resizable-split-pane";
import { RotateIcon } from "@/components/icons/rotate-icon";
import { IconButton } from "@/components/ui";
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
  const { state, attachFiles, sendMessage, restart } = usePlanChatWorkspace();

  if (!state.hasStarted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 text-center">
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 px-1">
        <h1 className="text-lg font-semibold tracking-tight text-surface-foreground">
          Plan workspace
        </h1>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<RotateIcon />}
          aria-label="Restart workspace"
          onClick={restart}
        />
      </div>

      <ResizableSplitPane
        left={
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <PlanChatPreview plan={state.currentArtifact} runStatus={state.runStatus} />
          </div>
        }
        right={
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <PlanChatThread
              messages={state.messages}
              streamingAssistantText={state.streamingAssistantText}
              runStatus={state.runStatus}
              errors={state.errors}
              phase={state.phase}
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
