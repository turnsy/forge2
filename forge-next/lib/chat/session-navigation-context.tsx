"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { SessionListItemData } from "@/components/coach/session-list-item";

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  insertedSessions: readonly SessionListItemData[];
  startSessionNavigation: (sessionId: string) => void;
  registerNewSession: (session: SessionListItemData) => void;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [insertedSessions, setInsertedSessions] = useState<
    SessionListItemData[]
  >([]);
  const currentSessionId = searchParams.get("sessionId");
  const pendingSessionId =
    targetSessionId !== null && targetSessionId !== currentSessionId
      ? targetSessionId
      : null;

  const startSessionNavigation = useCallback((sessionId: string) => {
    setTargetSessionId(sessionId);
  }, []);

  const registerNewSession = useCallback((session: SessionListItemData) => {
    setInsertedSessions((current) => {
      const withoutDuplicate = current.filter((entry) => entry.id !== session.id);
      return [session, ...withoutDuplicate];
    });
    setTargetSessionId(session.id);
  }, []);

  return (
    <SessionNavigationContext.Provider
      value={{
        pendingSessionId,
        insertedSessions,
        startSessionNavigation,
        registerNewSession,
      }}
    >
      {children}
    </SessionNavigationContext.Provider>
  );
}

export function useSessionNavigation() {
  const context = useContext(SessionNavigationContext);
  if (!context) {
    throw new Error(
      "useSessionNavigation must be used within SessionNavigationProvider",
    );
  }
  return context;
}

export function useOptionalSessionNavigation() {
  return useContext(SessionNavigationContext);
}
