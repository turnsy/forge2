import type { ReactNode } from "react";

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
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[92%] rounded-card px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "border border-coach-muted/40 bg-coach-muted/15 text-surface-foreground"
            : "border border-glass-border bg-glass text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]"
        }`}
        aria-live={isStreaming ? "polite" : undefined}
      >
        {children}
        {isStreaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-surface-muted align-middle" />
        ) : null}
      </div>
    </div>
  );
}
