const COACH_HOME_PATH = "/coach";

export function hasCoachWorkspaceQueryParams(
  searchParams: URLSearchParams,
): boolean {
  return (
    searchParams.has("sessionId") ||
    searchParams.has("planId") ||
    searchParams.has("new")
  );
}

export function navigateToCoachHome(router: {
  replace: (href: string) => void;
  refresh: () => void;
}): void {
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

export function navigateToCoachWorkspace(
  router: {
    replace: (href: string) => void;
    refresh: () => void;
  },
  params: {
    sessionId?: string | null;
    planId?: string | null;
  },
): void {
  const url = new URL(COACH_HOME_PATH, "https://example.com");

  if (params.sessionId) {
    url.searchParams.set("sessionId", params.sessionId);
  }

  if (params.planId) {
    url.searchParams.set("planId", params.planId);
  }

  router.replace(`${url.pathname}${url.search}`);
  router.refresh();
}

export function shouldForceCoachHomeNavigation(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  return pathname === COACH_HOME_PATH && hasCoachWorkspaceQueryParams(searchParams);
}
