import type { ReactNode } from "react";
import type { UserRole } from "@/lib/auth/types";
import { cardClass, cardFooterClass } from "@/lib/theme";

export function AuthShell({
  title,
  description,
  role,
  children,
  footer,
}: {
  title: ReactNode;
  description?: string;
  role?: UserRole;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
      <div className={cardClass(role)}>
        <header className="space-y-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm leading-6 text-surface-muted">{description}</p>
          ) : null}
        </header>
        {children}
        {footer ? <footer className={cardFooterClass()}>{footer}</footer> : null}
      </div>
    </main>
  );
}
