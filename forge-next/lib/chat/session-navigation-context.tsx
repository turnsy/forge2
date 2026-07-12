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
import { usePathname, useSearchParams } from "next/navigation";
import type { SessionListItemData } from "@/components/coach/session-list-item";
import { listTaskSessions } from "@/lib/chat/actions";
import { navigateToCoachSession } from "@/lib/chat/session-url";

type CoachSessionRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

type SessionNavigationContextValue = {
  pendingSessionId: string | null;
  sessions: readonly SessionListItemData[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  openSession: (sessionId: string, router: CoachSessionRouter) => void;
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

function sortSessionsByUpdatedAt(
  sessions: SessionListItemData[],
): SessionListItemData[] {
  return [...sessions].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function upsertSession(
  sessions: SessionListItemData[],
  session: SessionListItemData,
): SessionListItemData[] {
  const withoutSession = sessions.filter((entry) => entry.id !== session.id);
  return sortSessionsByUpdatedAt([session, ...withoutSession]);
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

function mergeFetchedSessions(
  current: SessionListItemData[],
  fetched: SessionListItemData[],
): SessionListItemData[] {
  const fetchedIds = new Set(fetched.map((session) => session.id));
  const localOnly = current.filter((session) => !fetchedIds.has(session.id));
  return sortSessionsByUpdatedAt([...fetched, ...localOnly]);
}

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routerSessionId = searchParams.get("sessionId");
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItemData[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const pendingSessionId =
    pathname === COACH_WORKSPACE_PATH &&
    targetSessionId !== null &&
    targetSessionId !== routerSessionId
      ? targetSessionId
      : null;

  useEffect(() => {
    if (targetSessionId === null) {
      return;
    }

    if (routerSessionId === targetSessionId) {
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
  }, [pathname, routerSessionId, targetSessionId]);

  const fetchSessions = useCallback(async (showLoading: boolean) => {
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
      setSessions((current) => (current.length === 0 ? [] : current));
      setSessionsLoading(false);
      return;
    }

    setSessions((current) => mergeFetchedSessions(current, result.sessions));
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const generation = ++fetchGenerationRef.current;

    async function loadInitialSessions() {
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

      setSessions((current) => mergeFetchedSessions(current, result.sessions));
      setSessionsLoading(false);
    }

    void loadInitialSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSessions = useCallback(async () => {
    await fetchSessions(sessions.length === 0);
  }, [fetchSessions, sessions.length]);

  const openSession = useCallback(
    (sessionId: string, router: CoachSessionRouter) => {
      setTargetSessionId(sessionId);
      navigateToCoachSession(router, sessionId);
    },
    [],
  );

  const registerNewSession = useCallback((session: SessionListItemData) => {
    setSessions((current) => upsertSession(current, session));
  }, []);

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
      pendingSessionId,
      sessions,
      sessionsLoading,
      sessionsError,
      openSession,
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
      openSession,
      refreshSessions,
      registerNewSession,
      removeSession,
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
