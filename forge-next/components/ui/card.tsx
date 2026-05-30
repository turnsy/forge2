import type { ReactNode } from "react";
import type { UserRole } from "@/lib/auth/types";
import { cardClass, cardFooterClass } from "@/lib/theme";

export function Card({
  role,
  className,
  children,
}: {
  role?: UserRole;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${cardClass(role)}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <header className={`space-y-3 text-center${className ? ` ${className}` : ""}`}>
      {children}
    </header>
  );
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <footer className={`${cardFooterClass()}${className ? ` ${className}` : ""}`}>
      {children}
    </footer>
  );
}
