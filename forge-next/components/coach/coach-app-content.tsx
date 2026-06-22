"use client";

import type { ReactNode } from "react";
import { CoachSessionLoadingView } from "@/components/coach/coach-session-loading-view";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

function CoachMainContent({ children }: { children: ReactNode }) {
  const { pendingSessionId } = useSessionNavigation();

  if (pendingSessionId) {
    return <CoachSessionLoadingView />;
  }

  return children;
}

export function CoachAppContent({ children }: { children: ReactNode }) {
  return (
    <SessionNavigationProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto">
        <CoachMainContent>{children}</CoachMainContent>
      </div>
    </SessionNavigationProvider>
  );
}
