"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";
import {
  navigateToCoachHome,
  shouldForceCoachHomeNavigation,
} from "@/lib/chat/session-url";
import { useOptionalSessionNavigation } from "@/lib/chat/session-navigation-context";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionNavigation = useOptionalSessionNavigation();

  return (
    <SidebarNavLink
      href="/coach"
      icon={icon}
      exact
      collapsed={collapsed}
      onClick={(event) => {
        if (!shouldForceCoachHomeNavigation(pathname, searchParams)) {
          return;
        }

        event.preventDefault();
        sessionNavigation?.clearSessionNavigation();
        navigateToCoachHome(router);
      }}
    >
      {children}
    </SidebarNavLink>
  );
}
