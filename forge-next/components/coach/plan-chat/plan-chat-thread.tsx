import { ChatBubble } from "@/components/ui/chat-bubble";
import { Spinner } from "@/components/ui";
import {
  getRunStatusLabel,
  isActiveRunStatus,
} from "@/lib/plan-chat/run-status-copy";
import type { PlanChatRunStatus, PlanChatMessage } from "@/lib/ai/plan-chat/types";
import type { PlanChatDisplayError, PlanChatWorkspacePhase } from "@/lib/plan-chat/types";

export function PlanChatThread({
  messages,
  streamingAssistantText,
  runStatus,
  errors,
  phase,
}: {
  messages: PlanChatMessage[];
  streamingAssistantText: string;
  runStatus: PlanChatRunStatus | null;
  errors: PlanChatDisplayError[];
  phase: PlanChatWorkspacePhase;
}) {
  const showStreaming =
    streamingAssistantText.length > 0 &&
    (messages.length === 0 ||
      messages[messages.length - 1]?.role !== "assistant" ||
      messages[messages.length - 1]?.content !== streamingAssistantText);

  const showRunStatus =
    phase === "uploading" ||
    (runStatus !== null && isActiveRunStatus(runStatus)) ||
    (phase === "streaming" && runStatus === null);

  const showErrors =
    errors.length > 0 && (phase === "error" || phase === "idle");

  const uploadLabel = phase === "uploading" ? "Uploading files…" : null;
  const statusLabel =
    runStatus && isActiveRunStatus(runStatus)
      ? getRunStatusLabel(runStatus)
      : phase === "streaming" && !runStatus
        ? "Thinking…"
        : uploadLabel;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-2">
      {messages.map((message, index) => (
        <ChatBubble key={`${message.role}-${index}`} role={message.role}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </ChatBubble>
      ))}
      {showRunStatus && statusLabel ? (
        <ChatBubble role="assistant">
          <div className="flex items-center gap-2.5 text-surface-muted">
            <Spinner className="h-4 w-4 shrink-0 border" label={statusLabel} />
            <span>{statusLabel}</span>
          </div>
        </ChatBubble>
      ) : null}
      {showStreaming ? (
        <ChatBubble role="assistant" isStreaming>
          <p className="whitespace-pre-wrap">{streamingAssistantText}</p>
        </ChatBubble>
      ) : null}
      {showErrors ? (
        <ChatBubble role="assistant">
          <ul className="space-y-1 text-sm text-red-300/95" role="alert">
            {errors.map((error, index) => (
              <li key={`${error.message}-${index}`}>
                {error.path ? (
                  <span className="font-mono text-xs text-red-200/80">
                    {error.path}:{" "}
                  </span>
                ) : null}
                {error.message}
              </li>
            ))}
          </ul>
        </ChatBubble>
      ) : null}
    </div>
  );
}
