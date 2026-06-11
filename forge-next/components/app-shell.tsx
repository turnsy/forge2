"use client";

import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Sidebar } from "@/components/sidebar";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

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
  const isMobile = useIsMobile();

  return (
    <div className="dark flex h-dvh min-h-0 bg-background text-foreground">
      <Sidebar role={role} fullName={fullName} email={email} />
      <div
        className={[
          "flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden",
          isMobile ? MOBILE_BOTTOM_NAV_OFFSET_CLASS : "",
        ].join(" ")}
      >
        {children}
      </div>
      {isMobile ? (
        <MobileBottomNav role={role} fullName={fullName} email={email} />
      ) : null}
    </div>
  );
}
