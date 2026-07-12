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

  if (routerSessionId !== null) {
    return routerSessionId;
  }

  if (typeof window !== "undefined") {
    void replaceStateRevision;
    return readCoachWorkspaceSessionId();
  }

  return null;
}
