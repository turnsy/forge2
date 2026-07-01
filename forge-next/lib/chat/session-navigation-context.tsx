"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { SessionListItemData } from "@/components/coach/session-list-item";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PendingFirstSend = {
  sessionId: string;
  message: string;
  clientArtifact?: {
    plan: WorkoutPlan;
    planId?: string | null;
    title?: string;
  } | null;
  contextFileIds?: string[];
};

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  insertedSessions: readonly SessionListItemData[];
  startSessionNavigation: (sessionId: string) => void;
  clearSessionNavigation: () => void;
  registerNewSession: (session: SessionListItemData) => void;
  stashPendingFirstSend: (pending: PendingFirstSend) => void;
  consumePendingFirstSend: (sessionId: string) => PendingFirstSend | null;
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
  const pendingFirstSendRef = useRef<PendingFirstSend | null>(null);
  const currentSessionId = searchParams.get("sessionId");
  const navigationTargetSessionId =
    pathname === COACH_WORKSPACE_PATH ? targetSessionId : null;
  const pendingSessionId =
    navigationTargetSessionId !== null &&
    navigationTargetSessionId !== currentSessionId
      ? navigationTargetSessionId
      : null;

  const startSessionNavigation = useCallback((sessionId: string) => {
    setTargetSessionId(sessionId);
  }, []);

  const clearSessionNavigation = useCallback(() => {
    setTargetSessionId(null);
  }, []);

  useEffect(() => {
    if (targetSessionId === null) {
      return;
    }

    if (currentSessionId === targetSessionId) {
      setTargetSessionId(null);
    }
  }, [currentSessionId, targetSessionId]);

  const registerNewSession = useCallback((session: SessionListItemData) => {
    setInsertedSessions((current) => {
      if (current.some((entry) => entry.id === session.id)) {
        return current;
      }

      return [session, ...current];
    });
  }, []);

  const stashPendingFirstSend = useCallback((pending: PendingFirstSend) => {
    pendingFirstSendRef.current = pending;
  }, []);

  const consumePendingFirstSend = useCallback((sessionId: string) => {
    const pending = pendingFirstSendRef.current;
    if (pending?.sessionId !== sessionId) {
      return null;
    }

    pendingFirstSendRef.current = null;
    return pending;
  }, []);

  const contextValue = useMemo(
    () => ({
      pendingSessionId,
      insertedSessions,
      startSessionNavigation,
      clearSessionNavigation,
      registerNewSession,
      stashPendingFirstSend,
      consumePendingFirstSend,
    }),
    [
      consumePendingFirstSend,
      clearSessionNavigation,
      insertedSessions,
      pendingSessionId,
      registerNewSession,
      startSessionNavigation,
      stashPendingFirstSend,
    ],
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
