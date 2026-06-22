"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  activeSessionId: string | null;
  startSessionNavigation: (sessionId: string) => void;
  clearActiveSession: () => void;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    () => urlSessionId,
  );

  const startSessionNavigation = useCallback((sessionId: string) => {
    setPendingSessionId(sessionId);
    setActiveSessionId(sessionId);
  }, []);

  const clearActiveSession = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  useEffect(() => {
    setActiveSessionId(urlSessionId);
  }, [urlSessionId]);

  useEffect(() => {
    if (!pendingSessionId) {
      return;
    }

    if (urlSessionId === pendingSessionId) {
      setPendingSessionId(null);
    }
  }, [pendingSessionId, urlSessionId]);

  return (
    <SessionNavigationContext.Provider
      value={{
        pendingSessionId,
        activeSessionId,
        startSessionNavigation,
        clearActiveSession,
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
