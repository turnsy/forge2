export type CoachWorkspaceUrlUpdate = {
  sessionId?: string | null;
  planId?: string | null;
  newPlan?: boolean | null;
};

export const COACH_WORKSPACE_URL_CHANGE_EVENT = "coach-workspace-url-change";

const COACH_HOME_PATH = "/coach";

function dispatchCoachWorkspaceUrlChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event(COACH_WORKSPACE_URL_CHANGE_EVENT));
  }
}

export function hasCoachWorkspaceQueryParams(
  searchParams: URLSearchParams,
): boolean {
  return (
    searchParams.has("sessionId") ||
    searchParams.has("planId") ||
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
    dispatchCoachWorkspaceUrlChange();
  }
}

export function clearCoachWorkspaceQueryParams(): void {
  syncCoachWorkspaceUrl({
    sessionId: null,
    planId: null,
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

export function navigateToCoachSession(
  router: {
    push: (href: string) => void;
    refresh: () => void;
  },
  sessionId: string,
): void {
  router.push(`${COACH_HOME_PATH}?sessionId=${sessionId}`);
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
