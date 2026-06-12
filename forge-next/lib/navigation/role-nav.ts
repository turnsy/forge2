import type { UserRole } from "@/lib/auth/types";

export type SidebarNavIcon =
  | "home"
  | "plans"
  | "athletes"
  | "history"
  | "settings";

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
  athlete: [
    { href: "/athlete", label: "Home", icon: "home", exact: true },
    { href: "/athlete/history", label: "History", icon: "history" },
    { href: "/athlete/settings", label: "Settings", icon: "settings" },
  ],
};

export function settingsPathForRole(role: UserRole): string {
  return `/${role}/settings`;
}
