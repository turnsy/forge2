"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";
import { isNavItemActive } from "@/lib/navigation/active-path";
import {
  navigateToCoachHome,
  shouldForceCoachHomeNavigation,
} from "@/lib/chat/session-url";
import { useCoachWorkspaceSearchParams } from "@/lib/chat/use-coach-workspace-session-id";

export function CoachHomeNavLink({
  children,
  icon,
  collapsed = false,
}: {
  children: ReactNode;
  icon?: ReactNode;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const workspaceSearchParams = useCoachWorkspaceSearchParams();
  const router = useRouter();
  const active = isNavItemActive(
    pathname,
    "/coach",
    true,
    workspaceSearchParams,
  );

  return (
    <SidebarNavLink
      href="/coach"
      icon={icon}
      exact
      collapsed={collapsed}
      active={active}
      onClick={(event) => {
        if (!shouldForceCoachHomeNavigation(pathname, workspaceSearchParams)) {
          return;
        }

        event.preventDefault();
        navigateToCoachHome(router);
      }}
    >
      {children}
    </SidebarNavLink>
  );
}
