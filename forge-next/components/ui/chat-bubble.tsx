import type { ReactNode } from "react";

const chatBubbleBaseClass =
  "max-w-[88%] px-4 py-2.5 text-[0.9375rem] leading-6";

const chatBubbleRoleClasses = {
  user: "rounded-[1.125rem] rounded-br-sm bg-coach/14 text-surface-foreground",
  assistant:
    "rounded-[1.125rem] rounded-bl-sm border border-surface-divider/90 bg-[#131315] text-surface-foreground",
} as const;

export function chatBubbleClass(role: "user" | "assistant"): string {
  return `${chatBubbleBaseClass} ${chatBubbleRoleClasses[role]}`;
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
        className={chatBubbleClass(role)}
        aria-live={isStreaming ? "polite" : undefined}
      >
        {children}
      </div>
    </div>
  );
}
