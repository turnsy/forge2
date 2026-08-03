export type CoachWorkspaceUrlUpdate = {
  sessionId?: string | null;
  planId?: string | null;
  assignmentId?: string | null;
  newPlan?: boolean | null;
};

const COACH_HOME_PATH = "/coach";

export function hasCoachWorkspaceQueryParams(
  searchParams: URLSearchParams,
): boolean {
  return (
    searchParams.has("sessionId") ||
    searchParams.has("planId") ||
    searchParams.has("assignmentId") ||
    searchParams.has("new")
  );
}

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

  if (update.assignmentId !== undefined) {
    if (update.assignmentId) {
      url.searchParams.set("assignmentId", update.assignmentId);
    } else {
      url.searchParams.delete("assignmentId");
    }
  }

  if (update.newPlan !== undefined) {
    if (update.newPlan) {
      url.searchParams.set("new", "1");
    } else {
      url.searchParams.delete("new");
    }
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export function clearCoachWorkspaceQueryParams(): void {
  syncCoachWorkspaceUrl({
    sessionId: null,
    planId: null,
    assignmentId: null,
    newPlan: null,
  });
}

export function navigateToCoachHome(router: {
  replace: (href: string) => void;
  refresh: () => void;
}): void {
  clearCoachWorkspaceQueryParams();
  router.replace(COACH_HOME_PATH);
  router.refresh();
}

export function shouldForceCoachHomeNavigation(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  return pathname === COACH_HOME_PATH && hasCoachWorkspaceQueryParams(searchParams);
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
