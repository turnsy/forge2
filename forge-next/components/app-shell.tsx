"use client";

import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Sidebar } from "@/components/sidebar";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";
import { SAFE_AREA_TOP_CLASS, SAFE_AREA_X_CLASS } from "@/lib/viewport/safe-area";

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
    <div className="dark fixed inset-0 flex min-h-0 bg-surface text-surface-foreground">
      <Sidebar role={role} fullName={fullName} email={email} />
      <div
        className={[
          "flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden",
          isMobile
            ? `${SAFE_AREA_TOP_CLASS} ${SAFE_AREA_X_CLASS} ${MOBILE_BOTTOM_NAV_OFFSET_CLASS}`
            : "",
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
