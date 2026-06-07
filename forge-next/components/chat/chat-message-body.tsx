import { MentionChip } from "@/components/prompt/mention-chip";
import type { ChatMessage } from "@/lib/chat/types";

export function ChatMessageBody({ message }: { message: ChatMessage }) {
  if (message.role !== "user" || !message.segments?.length) {
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  }

  return (
    <p className="whitespace-pre-wrap">
      {message.segments.map((segment, index) =>
        segment.type === "text" ? (
          <span key={`text-${index}`}>{segment.value}</span>
        ) : (
          <MentionChip
            key={`mention-${segment.id}-${index}`}
            kind={segment.kind}
            label={segment.label}
          />
        ),
      )}
    </p>
  );
}
