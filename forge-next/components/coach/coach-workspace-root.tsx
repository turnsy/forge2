"use client";

import type { ComponentProps } from "react";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import { resolveCoachWorkspaceRemountKey } from "@/lib/chat/coach-workspace-key";
import { useOptionalSessionNavigation } from "@/lib/chat/session-navigation-context";
import { useCoachWorkspaceSessionId } from "@/lib/chat/use-coach-workspace-url";

type CoachWorkspaceRootProps = ComponentProps<typeof CoachWorkspace> & {
  serverKey: string;
};

export function CoachWorkspaceRoot({
  serverKey,
  ...props
}: CoachWorkspaceRootProps) {
  const sessionNavigation = useOptionalSessionNavigation();
  const workspaceSessionId = useCoachWorkspaceSessionId();
  const homeNavigationEpoch = sessionNavigation?.homeNavigationEpoch ?? 0;
  const remountKey = resolveCoachWorkspaceRemountKey({
    serverKey,
    workspaceSessionId,
    homeNavigationEpoch,
  });

  return <CoachWorkspace key={remountKey} {...props} />;
}
