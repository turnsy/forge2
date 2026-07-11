"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COACH_WORKSPACE_URL_CHANGE_EVENT } from "@/lib/chat/session-url";

export function readCoachWorkspaceSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URL(window.location.href).searchParams.get("sessionId");
}

export function useCoachWorkspaceSessionId(): string | null {
  const searchParams = useSearchParams();
  const routerSessionId = searchParams.get("sessionId");
  const [sessionId, setSessionId] = useState<string | null>(routerSessionId);

  useEffect(() => {
    setSessionId(routerSessionId);
  }, [routerSessionId]);

  useEffect(() => {
    function sync() {
      setSessionId(readCoachWorkspaceSessionId());
    }

    window.addEventListener(COACH_WORKSPACE_URL_CHANGE_EVENT, sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(COACH_WORKSPACE_URL_CHANGE_EVENT, sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return sessionId;
}
