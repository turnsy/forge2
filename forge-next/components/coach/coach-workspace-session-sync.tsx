"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CoachWorkspaceSessionSync({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (urlSessionId !== sessionId) {
      router.refresh();
    }
  }, [router, sessionId, urlSessionId]);

  return null;
}
