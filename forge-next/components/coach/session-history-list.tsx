"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionListItem, type SessionListItemData } from "@/components/coach/session-list-item";
import { Button, Spinner } from "@/components/ui";
import { listTaskSessions } from "@/lib/chat/actions";
import { syncCoachSessionUrl } from "@/lib/chat/session-url";

const INITIAL_VISIBLE_COUNT = 5;
const EXPANDED_LIST_LIMIT = 50;

export function SessionHistoryList({
  activeSessionId,
  onActiveSessionDeleted,
  onExpand,
  className = "",
}: {
  activeSessionId?: string | null;
  onActiveSessionDeleted?: () => void;
  onExpand?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionListItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const resolvedActiveSessionId =
    activeSessionId ?? searchParams.get("sessionId");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await listTaskSessions(EXPANDED_LIST_LIMIT);

    if (!result.ok) {
      setError(result.message);
      setSessions([]);
      setLoading(false);
      return;
    }

    setSessions(result.sessions);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  function handleOpen(sessionId: string) {
    router.push(`/coach?sessionId=${sessionId}`);
  }

  function handleRenamed(sessionId: string, title: string) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId ? { ...session, title } : session,
      ),
    );
  }

  function handleDeleted(sessionId: string) {
    setSessions((current) => current.filter((session) => session.id !== sessionId));

    if (sessionId === resolvedActiveSessionId) {
      syncCoachSessionUrl(null);
      onActiveSessionDeleted?.();
      router.push("/coach");
    }
  }

  if (loading) {
    return (
      <div className={`flex justify-center py-4 ${className}`.trim()}>
        <Spinner className="h-5 w-5" label="Loading conversations" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 px-1 py-2 text-sm ${className}`.trim()}>
        <p className="text-surface-muted">{error}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={() => void loadSessions()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className={`px-2 py-2 text-sm text-surface-muted ${className}`.trim()}>
        No conversations yet
      </p>
    );
  }

  const visibleSessions = showAll
    ? sessions
    : sessions.slice(0, INITIAL_VISIBLE_COUNT);
  const canShowMore = !showAll && sessions.length > INITIAL_VISIBLE_COUNT;

  return (
    <div className={`flex flex-col gap-0.5 ${className}`.trim()}>
      {visibleSessions.map((session) => (
        <SessionListItem
          key={session.id}
          session={session}
          isActive={session.id === resolvedActiveSessionId}
          onOpen={handleOpen}
          onRenamed={handleRenamed}
          onDeleted={handleDeleted}
        />
      ))}
      {canShowMore ? (
        <button
          type="button"
          className="px-2 py-1.5 text-left text-sm font-medium text-surface-muted transition hover:text-surface-foreground"
          onClick={() => {
            onExpand?.();
            setShowAll(true);
          }}
        >
          Show more →
        </button>
      ) : null}
    </div>
  );
}
