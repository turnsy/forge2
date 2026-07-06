"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { SessionListItemData } from "@/components/coach/session-list-item";

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  insertedSessions: readonly SessionListItemData[];
  startSessionNavigation: (sessionId: string) => void;
  registerNewSession: (session: SessionListItemData) => void;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

const COACH_WORKSPACE_PATH = "/coach";

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [insertedSessions, setInsertedSessions] = useState<
    SessionListItemData[]
  >([]);
  const currentSessionId = searchParams.get("sessionId");
  const pendingSessionId =
    pathname === COACH_WORKSPACE_PATH &&
    targetSessionId !== null &&
    targetSessionId !== currentSessionId
      ? targetSessionId
      : null;

  useEffect(() => {
    if (targetSessionId === null) {
      return;
    }

    if (currentSessionId === targetSessionId) {
      startTransition(() => {
        setTargetSessionId(null);
      });
      return;
    }

    if (pathname !== COACH_WORKSPACE_PATH) {
      startTransition(() => {
        setTargetSessionId(null);
      });
    }
  }, [currentSessionId, pathname, targetSessionId]);

  const startSessionNavigation = useCallback((sessionId: string) => {
    setTargetSessionId(sessionId);
  }, []);

  const registerNewSession = useCallback((session: SessionListItemData) => {
    setInsertedSessions((current) => {
      if (current.some((entry) => entry.id === session.id)) {
        return current;
      }

      return [session, ...current];
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      pendingSessionId,
      insertedSessions,
      startSessionNavigation,
      registerNewSession,
    }),
    [insertedSessions, pendingSessionId, registerNewSession, startSessionNavigation],
  );

  return (
    <SessionNavigationContext.Provider value={contextValue}>
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
