"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  COACH_WORKSPACE_URL_CHANGE_EVENT,
  hasCoachWorkspaceQueryParams,
} from "@/lib/chat/session-url";

function readWindowSearchParams(): URLSearchParams {
  return new URL(window.location.href).searchParams;
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

    if (typeof window === "undefined") {
      return routerParams;
    }

    // Sidebar / home router navigation updates Next search params first.
    if (hasCoachWorkspaceQueryParams(routerParams)) {
      return routerParams;
    }

    // replaceState new-thread sync can update the window URL before the router.
    const windowParams = readWindowSearchParams();
    if (windowParams.get("sessionId")) {
      return windowParams;
    }

    return routerParams;
  }, [replaceStateRevision, routerParams]);
}

export function useCoachWorkspaceSessionId(): string | null {
  return useCoachWorkspaceSearchParams().get("sessionId");
}
