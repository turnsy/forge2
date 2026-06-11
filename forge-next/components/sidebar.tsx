"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HamburgerIcon } from "@/components/icons/hamburger-icon";
import {
  AthletesIcon,
  HistoryIcon,
  HomeIcon,
  PlansIcon,
  SettingsNavIcon,
} from "@/components/icons/sidebar-nav-icons";
import { SidebarToggleIcon } from "@/components/icons/sidebar-toggle-icon";
import { SidebarProfileMenu } from "@/components/sidebar-profile-menu";
import { IconButton } from "@/components/ui";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";
import type { UserRole } from "@/lib/auth/types";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  roleNavItems,
  type SidebarNavIcon,
} from "@/lib/navigation/role-nav";

const EDGE_SWIPE_ZONE_PX = 30;
const SWIPE_OPEN_THRESHOLD_PX = 48;
const SWIPE_CLOSE_THRESHOLD_PX = 48;

function navIcon(icon: SidebarNavIcon) {
  switch (icon) {
    case "home":
      return <HomeIcon />;
    case "plans":
      return <PlansIcon />;
    case "athletes":
      return <AthletesIcon />;
    case "history":
      return <HistoryIcon />;
    case "settings":
      return <SettingsNavIcon />;
  }
}

function SidebarContent({
  role,
  fullName,
  email,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}) {
  const navItems = roleNavItems[role];

  return (
    <>
      <div
        className={[
          "flex items-center px-3 py-4",
          collapsed ? "justify-center" : "justify-between gap-2",
        ].join(" ")}
      >
        {collapsed ? null : (
          <span className="truncate px-2 text-lg font-semibold tracking-tight text-surface-foreground">
            Forge
          </span>
        )}
        <IconButton
          variant="plain"
          size="sm"
          icon={<SidebarToggleIcon />}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        />
      </div>

      <nav
        className={[
          "flex flex-1 flex-col gap-1 py-3",
          collapsed ? "px-2" : "px-3",
        ].join(" ")}
      >
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.href}
            href={item.href}
            icon={navIcon(item.icon)}
            exact={item.exact}
            collapsed={collapsed}
            onClick={onNavigate}
          >
            {item.label}
          </SidebarNavLink>
        ))}
      </nav>

      <div
        className={["mt-auto py-3", collapsed ? "px-2" : "px-3"].join(" ")}
      >
        <SidebarProfileMenu
          role={role}
          fullName={fullName}
          email={email}
          collapsed={collapsed}
        />
      </div>
    </>
  );
}

function MobileSidebarDrawer({
  role,
  fullName,
  email,
  open,
  onOpen,
  onClose,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const swipeRef = useRef<{
    pointerId: number;
    startX: number;
    fromEdge: boolean;
  } | null>(null);

  const handleDrawerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!open) {
        return;
      }

      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        fromEdge: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [open],
  );

  const handleDrawerPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - swipe.startX;
      if (deltaX < -SWIPE_CLOSE_THRESHOLD_PX) {
        swipeRef.current = null;
        onClose();
      }
    },
    [onClose],
  );

  const handleDrawerPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId) {
        return;
      }

      swipeRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.clientX >= EDGE_SWIPE_ZONE_PX) {
        return;
      }

      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        fromEdge: true,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId || !swipe.fromEdge) {
        return;
      }

      const deltaX = event.clientX - swipe.startX;
      if (deltaX >= SWIPE_OPEN_THRESHOLD_PX) {
        swipeRef.current = null;
        onOpen();
      }
    }

    function handlePointerEnd(event: PointerEvent) {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId) {
        return;
      }

      swipeRef.current = null;
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [onOpen, open]);

  return (
    <>
      {!open ? (
        <div
          aria-hidden="true"
          className="fixed left-0 top-0 z-30 h-dvh w-[30px] touch-none md:hidden"
        />
      ) : null}

      {!open ? (
        <div className="fixed left-0 top-0 z-30 flex w-14 justify-center px-3 py-4 md:hidden">
          <IconButton
            variant="plain"
            size="sm"
            icon={<HamburgerIcon />}
            aria-label="Open sidebar"
            aria-expanded={false}
            onClick={onOpen}
          />
        </div>
      ) : null}

      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        ref={drawerRef}
        aria-hidden={!open}
        className={[
          "fixed left-0 top-0 z-50 flex h-dvh w-60 flex-col border-r border-surface-divider bg-surface text-surface-foreground transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        onPointerDown={handleDrawerPointerDown}
        onPointerMove={handleDrawerPointerMove}
        onPointerUp={handleDrawerPointerEnd}
        onPointerCancel={handleDrawerPointerEnd}
      >
        <SidebarContent
          role={role}
          fullName={fullName}
          email={email}
          collapsed={false}
          onToggleCollapsed={onClose}
          onNavigate={onClose}
        />
      </aside>
    </>
  );
}

export function Sidebar({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
}) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <MobileSidebarDrawer
        role={role}
        fullName={fullName}
        email={email}
        open={mobileOpen}
        onOpen={() => setMobileOpen(true)}
        onClose={() => setMobileOpen(false)}
      />
    );
  }

  return (
    <aside
      className={[
        "flex shrink-0 flex-col border-r border-surface-divider bg-surface text-surface-foreground transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      ].join(" ")}
    >
      <SidebarContent
        role={role}
        fullName={fullName}
        email={email}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />
    </aside>
  );
}
