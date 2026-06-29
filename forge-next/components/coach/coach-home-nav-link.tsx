"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";
import {
  navigateToCoachHome,
  shouldForceCoachHomeNavigation,
} from "@/lib/chat/session-url";

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
        navigateToCoachHome(router);
      }}
    >
      {children}
    </SidebarNavLink>
  );
}
