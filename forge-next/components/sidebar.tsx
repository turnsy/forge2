"use client";

import { useState } from "react";
import { SidebarProfileMenu } from "@/components/sidebar-profile-menu";
import {
  AthletesIcon,
  HomeIcon,
  PlansIcon,
} from "@/components/icons/sidebar-nav-icons";
import { SidebarToggleIcon } from "@/components/icons/sidebar-toggle-icon";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";
import type { UserRole } from "@/lib/auth/types";
import {
  roleNavItems,
  type SidebarNavIcon,
} from "@/lib/navigation/role-nav";

function navIcon(icon: SidebarNavIcon) {
  switch (icon) {
    case "home":
      return <HomeIcon />;
    case "plans":
      return <PlansIcon />;
    case "athletes":
      return <AthletesIcon />;
  }
}

const toggleButtonClass =
  "flex shrink-0 items-center justify-center rounded-xl p-2 text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function Sidebar({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = roleNavItems[role];

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
          <span className="truncate text-lg font-semibold tracking-tight text-surface-foreground px-2">
            Forge
          </span>
        )}
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={toggleButtonClass}
          onClick={() => setCollapsed((current) => !current)}
        >
          <SidebarToggleIcon />
        </button>
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
            icon={navIcon(item.icon)}
            exact={item.exact}
            collapsed={collapsed}
          >
            {item.label}
          </SidebarNavLink>
        ))}
      </nav>

      {collapsed ? null : (
        <div className="mt-auto px-3 py-3">
          <SidebarProfileMenu role={role} fullName={fullName} email={email} />
        </div>
      )}
    </aside>
  );
}
