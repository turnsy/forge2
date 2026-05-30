"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isNavItemActive } from "@/lib/navigation/active-path";

const baseClass =
  "flex w-full items-center gap-3 rounded-control px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coach/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const inactiveClass =
  "text-surface-muted hover:bg-glass hover:text-surface-foreground";

const activeClass = "bg-coach-muted/20 text-coach";

export function SidebarNavLink({
  href,
  children,
  icon,
  trailingIcon,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, href);

  return (
    <Link
      href={href}
      className={`${baseClass} ${active ? activeClass : inactiveClass}`}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {trailingIcon}
    </Link>
  );
}
