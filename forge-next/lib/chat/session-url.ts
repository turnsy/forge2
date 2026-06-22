export type CoachWorkspaceUrlUpdate = {
  sessionId?: string | null;
  planId?: string | null;
};

export function syncCoachWorkspaceUrl(update: CoachWorkspaceUrlUpdate = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (update.sessionId !== undefined) {
    if (update.sessionId) {
      url.searchParams.set("sessionId", update.sessionId);
    } else {
      url.searchParams.delete("sessionId");
    }
  }

  if (update.planId !== undefined) {
    if (update.planId) {
      url.searchParams.set("planId", update.planId);
    } else {
      url.searchParams.delete("planId");
    }
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export function syncCoachSessionUrl(sessionId: string | null): void {
  syncCoachWorkspaceUrl({ sessionId });
}

export function hasCoachSessionInUrl(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URL(window.location.href).searchParams.has("sessionId");
}
