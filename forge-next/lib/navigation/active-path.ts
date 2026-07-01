const COACH_HOME_HREF = "/coach";

function isPathActive(pathname: string, href: string, exact = false): boolean {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isCoachHomeWorkspaceActive(searchParams: URLSearchParams): boolean {
  return (
    !searchParams.has("sessionId") &&
    !searchParams.has("planId") &&
    !searchParams.has("new")
  );
}

export function isNavItemActive(
  pathname: string,
  href: string,
  exact = false,
  searchParams?: URLSearchParams,
): boolean {
  if (!isPathActive(pathname, href, exact)) {
    return false;
  }

  if (exact && href === COACH_HOME_HREF && searchParams) {
    return isCoachHomeWorkspaceActive(searchParams);
  }

  return true;
}
