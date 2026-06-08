"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isNavItemActive } from "@/lib/navigation/active-path";

const baseClass =
  "flex w-full items-center gap-3 rounded-xl px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const inactiveClass =
  "text-surface-muted hover:bg-glass hover:text-surface-foreground";

const activeClass = "bg-glass text-surface-foreground";

export function SidebarNavLink({
  href,
  children,
  icon,
  trailingIcon,
  exact = false,
  collapsed = false,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  exact?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, href, exact);
  const label =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined;

  return (
    <Link
      href={href}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={[
        baseClass,
        active ? activeClass : inactiveClass,
        collapsed ? "justify-center px-2" : "",
      ].join(" ")}
    >
      {icon}
      {collapsed ? (
        <span className="sr-only">{children}</span>
      ) : (
        <span className="flex-1">{children}</span>
      )}
      {collapsed ? null : trailingIcon}
    </Link>
  );
}
