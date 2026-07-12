"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { SessionListItem } from "@/components/coach/session-list-item";
import { Button, List, Spinner } from "@/components/ui";
import { useSessionNavigation } from "@/lib/chat/session-navigation-context";
import {
  navigateToCoachHome,
  navigateToCoachSession,
} from "@/lib/chat/session-url";
import {
  readWindowWorkspaceSessionId,
  useCoachWorkspaceSessionId,
} from "@/lib/chat/use-coach-workspace-url";
import { staggerDelayMs } from "@/lib/motion/stagger";

const INITIAL_VISIBLE_COUNT = 5;

function ShowMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Show more conversations"
      className="flex w-full min-h-9 items-center justify-center rounded-xl px-4 py-1.5 text-surface-muted transition hover:bg-glass hover:text-surface-foreground"
      onClick={onClick}
    >
      <ChevronDownIcon className="h-4 w-4" />
    </button>
  );
}

export function SessionHistoryList({
  onActiveSessionDeleted,
  onExpand,
  onSessionOpen,
  variant = "compact",
  className = "",
}: {
  onActiveSessionDeleted?: () => void;
  onExpand?: () => void;
  onSessionOpen?: (sessionId: string) => void;
  variant?: "compact" | "mobile";
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = useCoachWorkspaceSessionId();
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    removeSession,
    updateSession,
    refreshSessions,
  } = useSessionNavigation();
  const [showAll, setShowAll] = useState(false);

  function handleOpen(sessionId: string) {
    if (sessionId !== activeSessionId) {
      navigateToCoachSession(router, sessionId);
    }

    onSessionOpen?.(sessionId);
  }

  function handleRenamed(sessionId: string, title: string) {
    updateSession(sessionId, { title });
  }

  function handleDeleted(sessionId: string) {
    const routerSessionId = searchParams.get("sessionId");
    const windowSessionId = readWindowWorkspaceSessionId();
    const isActiveSession =
      sessionId === routerSessionId || sessionId === windowSessionId;

    removeSession(sessionId);

    if (isActiveSession) {
      onActiveSessionDeleted?.();
      navigateToCoachHome(router);
    }
  }

  if (sessionsLoading && sessions.length === 0) {
    return (
      <div className={`flex justify-center py-4 ${className}`.trim()}>
        <Spinner className="h-5 w-5" label="Loading conversations" />
      </div>
    );
  }

  if (sessionsError && sessions.length === 0) {
    return (
      <div className={`space-y-2 px-1 py-2 text-sm ${className}`.trim()}>
        <p className="text-surface-muted">{sessionsError}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={() => void refreshSessions()}
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
    variant !== "mobile" &&
    !showAll &&
    sessions.length > INITIAL_VISIBLE_COUNT;

  const listItems = visibleSessions.map((session, index) => (
    <SessionListItem
      key={session.id}
      session={session}
      isActive={session.id === activeSessionId}
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
            <ShowMoreButton
              onClick={() => {
                onExpand?.();
                setShowAll(true);
              }}
            />
          </li>
        ) : null}
      </List>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`.trim()}>
      {listItems}
      {canShowMore ? (
        <ShowMoreButton
          onClick={() => {
            onExpand?.();
            setShowAll(true);
          }}
        />
      ) : null}
    </div>
  );
}
