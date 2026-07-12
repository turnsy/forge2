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
import { useSearchParams } from "next/navigation";
import type { SessionListItemData } from "@/components/coach/session-list-item";
import { listTaskSessions } from "@/lib/chat/actions";

type SessionNavigationContextValue = {
  sessions: readonly SessionListItemData[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  removeSession: (sessionId: string) => void;
  updateSession: (
    sessionId: string,
    patch: Partial<Pick<SessionListItemData, "title" | "updatedAt">>,
  ) => void;
  refreshSessions: () => Promise<void>;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

const SESSION_LIST_LIMIT = 50;

function sortSessionsByUpdatedAt(
  sessions: SessionListItemData[],
): SessionListItemData[] {
  return [...sessions].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function updateSessionInList(
  sessions: SessionListItemData[],
  sessionId: string,
  patch: Partial<Pick<SessionListItemData, "title" | "updatedAt">>,
): SessionListItemData[] {
  return sortSessionsByUpdatedAt(
    sessions.map((session) =>
      session.id === sessionId ? { ...session, ...patch } : session,
    ),
  );
}

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [sessions, setSessions] = useState<SessionListItemData[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const hasMountedRef = useRef(false);

  const loadSessions = useCallback(async (showLoading: boolean) => {
    const generation = ++fetchGenerationRef.current;
    setSessionsError(null);

    if (showLoading) {
      setSessionsLoading(true);
    }

    const result = await listTaskSessions(SESSION_LIST_LIMIT);

    if (generation !== fetchGenerationRef.current) {
      return;
    }

    if (!result.ok) {
      setSessionsError(result.message);
      setSessionsLoading(false);
      return;
    }

    setSessions(result.sessions);
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialSessions() {
      const generation = ++fetchGenerationRef.current;
      setSessionsError(null);
      setSessionsLoading(true);

      const result = await listTaskSessions(SESSION_LIST_LIMIT);

      if (cancelled || generation !== fetchGenerationRef.current) {
        return;
      }

      if (!result.ok) {
        setSessionsError(result.message);
        setSessions([]);
        setSessionsLoading(false);
        return;
      }

      setSessions(result.sessions);
      setSessionsLoading(false);
      hasMountedRef.current = true;
    }

    void loadInitialSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current || !sessionId) {
      return;
    }

    let cancelled = false;

    async function refetchSessionsForNavigation() {
      const generation = ++fetchGenerationRef.current;
      const result = await listTaskSessions(SESSION_LIST_LIMIT);

      if (cancelled || generation !== fetchGenerationRef.current) {
        return;
      }

      if (!result.ok) {
        return;
      }

      setSessions(result.sessions);
    }

    void refetchSessionsForNavigation();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const refreshSessions = useCallback(async () => {
    await loadSessions(sessions.length === 0);
  }, [loadSessions, sessions.length]);

  const removeSession = useCallback((sessionId: string) => {
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
  }, []);

  const updateSession = useCallback(
    (
      sessionId: string,
      patch: Partial<Pick<SessionListItemData, "title" | "updatedAt">>,
    ) => {
      setSessions((current) => updateSessionInList(current, sessionId, patch));
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      sessions,
      sessionsLoading,
      sessionsError,
      removeSession,
      updateSession,
      refreshSessions,
    }),
    [
      sessions,
      sessionsLoading,
      sessionsError,
      removeSession,
      updateSession,
      refreshSessions,
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
