"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COACH_WORKSPACE_URL_CHANGE_EVENT } from "@/lib/chat/session-url";

export function readCoachWorkspaceSearchParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URL(window.location.href).searchParams;
}

export function readCoachWorkspaceSessionId(): string | null {
  return readCoachWorkspaceSearchParams().get("sessionId");
}

export function useCoachWorkspaceSearchParams(): URLSearchParams {
  const routerParams = useSearchParams();
  const [replaceStateRevision, setReplaceStateRevision] = useState(0);

  useEffect(() => {
    function handleUrlChange() {
      setReplaceStateRevision((revision) => revision + 1);
    }

    window.addEventListener(COACH_WORKSPACE_URL_CHANGE_EVENT, handleUrlChange);
    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener(
        COACH_WORKSPACE_URL_CHANGE_EVENT,
        handleUrlChange,
      );
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  return useMemo(() => {
    void replaceStateRevision;
    void routerParams;

    if (typeof window === "undefined") {
      return routerParams;
    }

    return readCoachWorkspaceSearchParams();
  }, [replaceStateRevision, routerParams]);
}

export function useCoachWorkspaceSessionId(): string | null {
  return useCoachWorkspaceSearchParams().get("sessionId");
}
