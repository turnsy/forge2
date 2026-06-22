"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionListItem, type SessionListItemData } from "@/components/coach/session-list-item";
import { Button, List, Spinner } from "@/components/ui";
import { listTaskSessions } from "@/lib/chat/actions";
import { useOptionalSessionNavigation } from "@/lib/chat/session-navigation-context";
import { syncCoachSessionUrl } from "@/lib/chat/session-url";
import { staggerDelayMs } from "@/lib/motion/stagger";

const INITIAL_VISIBLE_COUNT = 5;
const EXPANDED_LIST_LIMIT = 50;

export function SessionHistoryList({
  activeSessionId,
  onActiveSessionDeleted,
  onExpand,
  onSessionOpen,
  variant = "compact",
  className = "",
}: {
  activeSessionId?: string | null;
  onActiveSessionDeleted?: () => void;
  onExpand?: () => void;
  onSessionOpen?: (sessionId: string) => void;
  variant?: "compact" | "mobile";
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionNavigation = useOptionalSessionNavigation();
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
    if (sessionId !== resolvedActiveSessionId) {
      sessionNavigation?.startSessionNavigation(sessionId);
      router.push(`/coach?sessionId=${sessionId}`);
      router.refresh();
    }

    onSessionOpen?.(sessionId);
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

  const visibleSessions =
    variant === "mobile" || showAll
      ? sessions
      : sessions.slice(0, INITIAL_VISIBLE_COUNT);
  const canShowMore =
    variant !== "mobile" && !showAll && sessions.length > INITIAL_VISIBLE_COUNT;

  const listItems = visibleSessions.map((session, index) => (
    <SessionListItem
      key={session.id}
      session={session}
      isActive={session.id === resolvedActiveSessionId}
      onOpen={handleOpen}
      onRenamed={handleRenamed}
      onDeleted={handleDeleted}
      variant={variant}
      appearIndex={variant === "mobile" ? index : undefined}
    />
  ));

  if (variant === "mobile") {
    return (
      <List className={`gap-2${className ? ` ${className}` : ""}`}>
        {listItems.map((item, index) => (
          <li
            key={visibleSessions[index].id}
            className="list-none animate-fade-in"
            style={{ animationDelay: `${staggerDelayMs(index)}ms` }}
          >
            {item}
          </li>
        ))}
        {canShowMore ? (
          <li className="list-none">
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
          </li>
        ) : null}
      </List>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`.trim()}>
      {listItems}
      {canShowMore ? (
        <button
          type="button"
          className="rounded-xl px-4 py-1.5 text-left text-sm font-semibold text-surface-muted transition hover:bg-glass hover:text-surface-foreground"
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
