"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  startSessionNavigation: (sessionId: string) => void;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const currentSessionId = searchParams.get("sessionId");
  const pendingSessionId =
    targetSessionId !== null && targetSessionId !== currentSessionId
      ? targetSessionId
      : null;

  const startSessionNavigation = useCallback((sessionId: string) => {
    setTargetSessionId(sessionId);
  }, []);

  return (
    <SessionNavigationContext.Provider
      value={{ pendingSessionId, startSessionNavigation }}
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
