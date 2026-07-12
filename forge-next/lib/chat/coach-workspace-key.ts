export function resolveCoachWorkspaceRemountKey(input: {
  serverKey: string;
  workspaceSessionId: string | null;
  homeNavigationEpoch: number;
}): string {
  const { serverKey, workspaceSessionId, homeNavigationEpoch } = input;

  if (serverKey.startsWith("session-")) {
    if (workspaceSessionId) {
      return serverKey;
    }

    return `home-${homeNavigationEpoch}`;
  }

  if (serverKey === "coach-home") {
    return `home-${homeNavigationEpoch}`;
  }

  return serverKey;
}
