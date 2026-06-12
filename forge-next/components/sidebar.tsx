"use client";

import { useState } from "react";
import { SidebarToggleIcon } from "@/components/icons/sidebar-toggle-icon";
import { SidebarProfileMenu } from "@/components/sidebar-profile-menu";
import { IconButton } from "@/components/ui";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { renderNavIcon } from "@/lib/navigation/nav-icon";
import { roleNavItems } from "@/lib/navigation/role-nav";

export function Sidebar({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
}) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = roleNavItems[role];

  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={[
        "flex shrink-0 flex-col border-r border-surface-divider bg-surface text-surface-foreground transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center px-3 py-4",
          collapsed ? "justify-center" : "justify-between gap-2",
        ].join(" ")}
      >
        {collapsed ? null : (
          <span className="truncate px-2 text-lg font-semibold tracking-tight text-surface-foreground">
            Forge
          </span>
        )}
        <IconButton
          variant="plain"
          size="sm"
          icon={<SidebarToggleIcon />}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
        />
      </div>

      <nav
        className={[
          "flex flex-1 flex-col gap-1 py-3",
          collapsed ? "px-2" : "px-3",
        ].join(" ")}
      >
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.href}
            href={item.href}
            icon={renderNavIcon(item.icon)}
            exact={item.exact}
            collapsed={collapsed}
          >
            {item.label}
          </SidebarNavLink>
        ))}
      </nav>

      <div
        className={["mt-auto py-3", collapsed ? "px-2" : "px-3"].join(" ")}
      >
        <SidebarProfileMenu
          role={role}
          fullName={fullName}
          email={email}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
