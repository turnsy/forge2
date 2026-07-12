import { hasCoachWorkspaceQueryParams } from "@/lib/chat/session-url";

const COACH_HOME_HREF = "/coach";

function isPathActive(pathname: string, href: string, exact = false): boolean {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
    return !hasCoachWorkspaceQueryParams(searchParams);
  }

  return true;
}
