import { ChatBubble } from "@/components/ui/chat-bubble";
import { Spinner } from "@/components/ui";
import {
  getRunStatusLabel,
  isActiveRunStatus,
} from "@/lib/chat/run-status-copy";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";

export function ChatThread({
  messages,
  streamingAssistantText,
  runStatus,
  errors,
  phase,
  layout = "split",
}: {
  messages: ChatMessage[];
  streamingAssistantText: string;
  runStatus: ChatStatus | null;
  errors: ChatDisplayError[];
  phase: ChatWorkspacePhase;
  layout?: "split" | "single";
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2${
          layout === "single" ? " px-1 md:px-2" : " px-1"
        }`}
      >
        {messages.map((message, index) => (
          <ChatBubble key={`${message.role}-${index}`} role={message.role}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </ChatBubble>
        ))}
        {showStreaming ? (
          <ChatBubble role="assistant" isStreaming>
            <p className="whitespace-pre-wrap">{streamingAssistantText}</p>
          </ChatBubble>
        ) : null}
        {showRunStatus && statusLabel ? (
          <ChatBubble role="assistant">
            <div className="flex items-center gap-2.5 text-surface-muted">
              <Spinner className="h-4 w-4 shrink-0 border" label={statusLabel} />
              <span>{statusLabel}</span>
            </div>
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
    </div>
  );
}
