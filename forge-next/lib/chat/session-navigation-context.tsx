"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
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
  registerNewSession: (session: SessionListItemData) => void;
  stashPendingFirstSend: (pending: PendingFirstSend) => void;
  consumePendingFirstSend: (sessionId: string) => PendingFirstSend | null;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [insertedSessions, setInsertedSessions] = useState<
    SessionListItemData[]
  >([]);
  const pendingFirstSendRef = useRef<PendingFirstSend | null>(null);
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

  return (
    <SessionNavigationContext.Provider
      value={{
        pendingSessionId,
        insertedSessions,
        startSessionNavigation,
        registerNewSession,
        stashPendingFirstSend,
        consumePendingFirstSend,
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
