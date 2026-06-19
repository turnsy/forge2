import type { ReactNode } from "react";
import { cardClass, cardFooterClass } from "@/lib/theme";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${cardClass()}${className ? ` ${className}` : ""}`}>
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
