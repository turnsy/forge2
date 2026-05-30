import type { UserRole } from "@/lib/auth/types";

export type SidebarNavIcon = "home" | "plans" | "athletes";

export type RoleNavItem = {
  href: string;
  label: string;
  icon: SidebarNavIcon;
  exact?: boolean;
};

export const roleNavItems: Record<UserRole, RoleNavItem[]> = {
  coach: [
    { href: "/coach", label: "Home", icon: "home", exact: true },
    { href: "/coach/plans", label: "Plans", icon: "plans" },
    { href: "/coach/athletes", label: "Athletes", icon: "athletes" },
  ],
  athlete: [{ href: "/athlete", label: "Home", icon: "home", exact: true }],
};

export function settingsPathForRole(role: UserRole): string {
  return `/${role}/settings`;
}
