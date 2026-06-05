import { ChatBubble } from "@/components/ui/chat-bubble";
import type { PlanChatMessage } from "@/lib/ai/plan-chat/types";

export function PlanChatThread({
  messages,
  streamingAssistantText,
}: {
  messages: PlanChatMessage[];
  streamingAssistantText: string;
}) {
  const showStreaming =
    streamingAssistantText.length > 0 &&
    (messages.length === 0 ||
      messages[messages.length - 1]?.role !== "assistant" ||
      messages[messages.length - 1]?.content !== streamingAssistantText);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-2">
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
    </div>
  );
}
