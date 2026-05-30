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
    <div className="dark flex min-h-screen bg-background text-foreground">
      <Sidebar role={role} fullName={fullName} email={email} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
