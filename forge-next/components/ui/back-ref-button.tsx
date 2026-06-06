import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

export function BackRefButton({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "onClick" | "className">) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium text-surface-muted transition hover:text-surface-foreground${className ? ` ${className}` : ""}`}
    >
      {children}
    </Link>
  );
}
