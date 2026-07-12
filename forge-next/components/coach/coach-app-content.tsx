"use client";

import type { ReactNode } from "react";
import { CoachSessionLoadingView } from "@/components/coach/coach-session-loading-view";
import { useSessionNavigation } from "@/lib/chat/session-navigation-context";

export function CoachMainContent({ children }: { children: ReactNode }) {
  const { pendingSessionId } = useSessionNavigation();

  if (pendingSessionId) {
    return <CoachSessionLoadingView />;
  }

  return children;
}

export function CoachAppContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <CoachMainContent>{children}</CoachMainContent>
    </div>
  );
}
