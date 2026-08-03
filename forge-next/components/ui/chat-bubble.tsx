import type { ReactNode } from "react";
import { chatBubbleClass as chatBubbleSurfaceClass } from "@/lib/theme";

export function chatBubbleClass(role: "user" | "assistant"): string {
  return chatBubbleSurfaceClass(role);
}

export function ChatBubble({
  role,
  children,
  isStreaming = false,
}: {
  role: "user" | "assistant";
  children: ReactNode;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={chatBubbleSurfaceClass(role)}
        aria-live={isStreaming ? "polite" : undefined}
      >
        {children}
      </div>
    </div>
  );
}
