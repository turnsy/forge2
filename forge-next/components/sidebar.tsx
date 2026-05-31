import { SidebarProfileMenu } from "@/components/sidebar-profile-menu";
import {
  AthletesIcon,
  HomeIcon,
  PlansIcon,
} from "@/components/icons/sidebar-nav-icons";
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

export function Sidebar({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
}) {
  const navItems = roleNavItems[role];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-divider bg-surface text-surface-foreground">
      <div className="px-5 py-5 text-center">
        <span className="text-lg font-semibold tracking-tight">Forge</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.href}
            href={item.href}
            icon={navIcon(item.icon)}
            exact={item.exact}
          >
            {item.label}
          </SidebarNavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 py-3">
        <SidebarProfileMenu role={role} fullName={fullName} email={email} />
      </div>
    </aside>
  );
}
