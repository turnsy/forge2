import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import type { UserRole } from "@/lib/auth/types";

export function AppShell({
  role,
  fullName,
  email,
  children,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="dark flex h-dvh min-h-0 bg-background text-foreground">
      <Sidebar role={role} fullName={fullName} email={email} />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden">
        {children}
      </div>
    </div>
  );
}
