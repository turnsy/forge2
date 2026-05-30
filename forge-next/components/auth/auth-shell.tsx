import type { ReactNode } from "react";
import type { UserRole } from "@/lib/auth/types";
import { Card, CardFooter, CardHeader } from "@/components/ui";

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
      <Card role={role}>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm leading-6 text-surface-muted">{description}</p>
          ) : null}
        </CardHeader>
        {children}
        {footer ? <CardFooter>{footer}</CardFooter> : null}
      </Card>
    </main>
  );
}
