"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { SessionListItemData } from "@/components/coach/session-list-item";
import { listTaskSessions } from "@/lib/chat/actions";
import { mergeSessionLists } from "@/lib/chat/session-history-merge";
import { useCoachWorkspaceSessionId } from "@/lib/chat/use-coach-workspace-session-id";

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  sessions: readonly SessionListItemData[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  startSessionNavigation: (sessionId: string) => void;
  registerNewSession: (session: SessionListItemData) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (
    sessionId: string,
    patch: Partial<Pick<SessionListItemData, "title" | "updatedAt">>,
  ) => void;
  refreshSessions: () => Promise<void>;
};

const SessionNavigationContext =
  createContext<SessionNavigationContextValue | null>(null);

const COACH_WORKSPACE_PATH = "/coach";
const SESSION_LIST_LIMIT = 50;

function updateSessionInList(
  sessions: SessionListItemData[],
  sessionId: string,
  patch: Partial<Pick<SessionListItemData, "title" | "updatedAt">>,
): SessionListItemData[] {
  return sessions.map((session) =>
    session.id === sessionId ? { ...session, ...patch } : session,
  );
}

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentSessionId = useCoachWorkspaceSessionId();
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [fetchedSessions, setFetchedSessions] = useState<SessionListItemData[]>(
    [],
  );
  const [insertedSessions, setInsertedSessions] = useState<
    SessionListItemData[]
  >([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const sessions = useMemo(
    () => mergeSessionLists(fetchedSessions, insertedSessions),
    [fetchedSessions, insertedSessions],
  );

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

  const loadSessions = useCallback(async (showLoading: boolean) => {
    const generation = ++fetchGenerationRef.current;

    if (showLoading) {
      setSessionsLoading(true);
    }
    setSessionsError(null);

    const result = await listTaskSessions(SESSION_LIST_LIMIT);

    if (generation !== fetchGenerationRef.current) {
      return;
    }

    if (!result.ok) {
      setSessionsError(result.message);
      setFetchedSessions((current) => (current.length === 0 ? [] : current));
      setSessionsLoading(false);
      return;
    }

    const fetchedIds = new Set(result.sessions.map((session) => session.id));
    setFetchedSessions(result.sessions);
    setInsertedSessions((current) =>
      current.filter((session) => !fetchedIds.has(session.id)),
    );
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    void loadSessions(true);
  }, [loadSessions]);

  const refreshSessions = useCallback(async () => {
    const hasCachedSessions =
      fetchedSessions.length > 0 || insertedSessions.length > 0;
    await loadSessions(!hasCachedSessions);
  }, [fetchedSessions.length, insertedSessions.length, loadSessions]);

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

  const removeSession = useCallback((sessionId: string) => {
    setFetchedSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
    setInsertedSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );
  }, []);

  const updateSession = useCallback(
    (
      sessionId: string,
      patch: Partial<Pick<SessionListItemData, "title" | "updatedAt">>,
    ) => {
      setFetchedSessions((current) =>
        updateSessionInList(current, sessionId, patch),
      );
      setInsertedSessions((current) =>
        updateSessionInList(current, sessionId, patch),
      );
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      pendingSessionId,
      sessions,
      sessionsLoading,
      sessionsError,
      startSessionNavigation,
      registerNewSession,
      removeSession,
      updateSession,
      refreshSessions,
    }),
    [
      pendingSessionId,
      sessions,
      sessionsLoading,
      sessionsError,
      refreshSessions,
      registerNewSession,
      removeSession,
      startSessionNavigation,
      updateSession,
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
