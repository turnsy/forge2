"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isNavItemActive } from "@/lib/navigation/active-path";
import {
  sidebarItemActiveClassName,
  sidebarItemClassName,
  sidebarItemInactiveClassName,
} from "@/lib/navigation/sidebar-item-styles";

const baseClass = sidebarItemClassName;

const inactiveClass = sidebarItemInactiveClassName;

const activeClass = sidebarItemActiveClassName;

export function SidebarNavLink({
  href,
  children,
  icon,
  trailingIcon,
  exact = false,
  collapsed = false,
  onClick,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  exact?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
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
      onClick={onClick}
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
