"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GearIcon } from "@/components/icons/gear-icon";
import { LogOutIcon } from "@/components/icons/log-out-icon";
import type { UserRole } from "@/lib/auth/types";
import { isNavItemActive } from "@/lib/navigation/active-path";
import {
  MOBILE_BOTTOM_NAV_SELECTION_CLASS,
  MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX,
  MOBILE_BOTTOM_NAV_TRAY_CLASS,
  MOBILE_BOTTOM_NAV_TRAY_SURFACE_CLASS,
  MOBILE_BOTTOM_NAV_WIDTH_CLASS,
} from "@/lib/navigation/mobile-bottom-nav-layout";
import { renderNavIcon } from "@/lib/navigation/nav-icon";
import { profileLabels } from "@/lib/navigation/profile-labels";
import {
  roleNavItems,
  settingsPathForRole,
  type RoleNavItem,
} from "@/lib/navigation/role-nav";
import { useOptionalSessionNavigation } from "@/lib/chat/session-navigation-context";
import {
  navigateToCoachHome,
  shouldForceCoachHomeNavigation,
} from "@/lib/chat/session-url";
import { roleFocusRingClass } from "@/lib/theme/roles";

const DRAG_THRESHOLD_PX = 10;

const slotClass =
  "relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20";

const slotActiveClass = "text-surface-foreground";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

type SlotMetrics = {
  left: number;
  width: number;
  centerX: number;
};

type IndicatorPosition = {
  left: number;
  width: number;
};

function setPageAnchored(anchored: boolean) {
  if (anchored) {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return;
  }

  document.body.style.overflow = "";
  document.body.style.touchAction = "";
}

function metricsToIndicator(metrics: SlotMetrics): IndicatorPosition {
  return {
    left: metrics.left - MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX / 2,
    width: metrics.width + MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX,
  };
}

function centerToIndicator(centerX: number, slotWidth: number): IndicatorPosition {
  return {
    left: centerX - (slotWidth + MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX) / 2,
    width: slotWidth + MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX,
  };
}

function MobileBottomProfileButton({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { displayName } = profileLabels(fullName, email);
  const settingsPath = settingsPathForRole(role);
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Profile menu"
          className="absolute bottom-full right-0 z-50 mb-2 flex w-48 flex-col gap-1 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface"
        >
          {role !== "athlete" ? (
            <Link
              href={settingsPath}
              role="menuitem"
              className={menuItemClass}
              onClick={() => setOpen(false)}
            >
              <GearIcon />
              Settings
            </Link>
          ) : null}
          <form action="/auth/logout" method="post">
            <button type="submit" role="menuitem" className={menuItemClass}>
              <LogOutIcon />
              Log out
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className={[slotClass, roleFocusRingClass(role), open ? slotActiveClass : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setOpen((current) => !current)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-glass-border bg-glass-nested text-xs font-semibold text-surface-foreground">
          {initial}
        </span>
      </button>
    </div>
  );
}

function BottomNavSlot({
  item,
  pathname,
  searchParams,
  router,
  slotRef,
  onActivePointerDown,
  onActivePointerMove,
  onActivePointerUp,
  onActivePointerCancel,
}: {
  item: RoleNavItem;
  pathname: string;
  searchParams: URLSearchParams;
  router: ReturnType<typeof useRouter>;
  slotRef: (node: HTMLButtonElement | HTMLAnchorElement | null) => void;
  onActivePointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onActivePointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onActivePointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onActivePointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const sessionNavigation = useOptionalSessionNavigation();
  const active = isNavItemActive(pathname, item.href, item.exact, searchParams);
  const className = [slotClass, active ? slotActiveClass : ""]
    .filter(Boolean)
    .join(" ");

  const handleCoachHomeClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (!shouldForceCoachHomeNavigation(pathname, searchParams)) {
      return;
    }

    event.preventDefault();
    if (sessionNavigation) {
      sessionNavigation.goToCoachHome(router);
      return;
    }

    navigateToCoachHome(router);
  };

  if (active) {
    return (
      <button
        ref={slotRef}
        type="button"
        aria-label={item.label}
        aria-current="page"
        className={className}
        onPointerDown={onActivePointerDown}
        onPointerMove={onActivePointerMove}
        onPointerUp={onActivePointerUp}
        onPointerCancel={onActivePointerCancel}
      >
        {renderNavIcon(item.icon)}
      </button>
    );
  }

  return (
    <Link
      ref={slotRef}
      href={item.href}
      aria-label={item.label}
      className={className}
      onClick={item.href === "/coach" ? handleCoachHomeClick : undefined}
    >
      {renderNavIcon(item.icon)}
    </Link>
  );
}

export function MobileBottomNav({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navItems = roleNavItems[role];
  const trayRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<{
    pointerId: number;
    sourceHref: string;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [committedHref, setCommittedHref] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<IndicatorPosition | null>(null);

  const getSlotMetrics = useCallback((href: string): SlotMetrics | null => {
    const node = slotRefs.current.get(href);
    const tray = trayRef.current;
    if (!node || !tray) {
      return null;
    }

    const nodeRect = node.getBoundingClientRect();
    const trayRect = tray.getBoundingClientRect();

    return {
      left: nodeRect.left - trayRect.left,
      width: nodeRect.width,
      centerX: nodeRect.left - trayRect.left + nodeRect.width / 2,
    };
  }, []);

  const getActiveItem = useCallback(
    () =>
      navItems.find((item) =>
        isNavItemActive(pathname, item.href, item.exact, searchParams),
      ) ?? null,
    [navItems, pathname, searchParams],
  );

  const activeHref = getActiveItem()?.href ?? null;
  const indicatorTargetHref =
    committedHref && committedHref !== activeHref ? committedHref : activeHref;

  const syncIndicatorToHref = useCallback(
    (href: string) => {
      const metrics = getSlotMetrics(href);
      if (metrics) {
        setIndicator(metricsToIndicator(metrics));
      }
    },
    [getSlotMetrics],
  );

  const syncIndicatorToResolved = useCallback(() => {
    if (indicatorTargetHref) {
      syncIndicatorToHref(indicatorTargetHref);
    }
  }, [indicatorTargetHref, syncIndicatorToHref]);

  const getNavSlotCenterBounds = useCallback(() => {
    const centers = navItems
      .map((item) => getSlotMetrics(item.href)?.centerX)
      .filter((value): value is number => value !== undefined);

    if (centers.length === 0) {
      return null;
    }

    return {
      min: Math.min(...centers),
      max: Math.max(...centers),
    };
  }, [getSlotMetrics, navItems]);

  const findNearestSlotHref = useCallback(
    (clientX: number) => {
      const tray = trayRef.current;
      if (!tray) {
        return null;
      }

      const trayRect = tray.getBoundingClientRect();
      const pointerX = clientX - trayRect.left;
      let nearestHref: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const item of navItems) {
        const metrics = getSlotMetrics(item.href);
        if (!metrics) {
          continue;
        }

        const distance = Math.abs(metrics.centerX - pointerX);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestHref = item.href;
        }
      }

      return nearestHref;
    },
    [getSlotMetrics, navItems],
  );

  const setIndicatorToPointer = useCallback(
    (clientX: number, sourceHref: string) => {
      const sourceMetrics = getSlotMetrics(sourceHref);
      const bounds = getNavSlotCenterBounds();
      if (!sourceMetrics || !bounds) {
        return;
      }

      const tray = trayRef.current;
      if (!tray) {
        return;
      }

      const trayRect = tray.getBoundingClientRect();
      const pointerX = clientX - trayRect.left;
      const centerX = Math.max(bounds.min, Math.min(bounds.max, pointerX));

      setIndicator(centerToIndicator(centerX, sourceMetrics.width));
    },
    [getNavSlotCenterBounds, getSlotMetrics],
  );

  useLayoutEffect(() => {
    if (isDragging) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      syncIndicatorToResolved();
    });

    return () => cancelAnimationFrame(frame);
  }, [isDragging, syncIndicatorToResolved, indicatorTargetHref]);

  useEffect(() => {
    function handleResize() {
      if (!isDragging) {
        syncIndicatorToResolved();
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging, syncIndicatorToResolved]);

  const resetDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
    setPageAnchored(false);
  }, []);

  useEffect(() => {
    return () => {
      setPageAnchored(false);
    };
  }, []);

  const handleActivePointerDown = useCallback(
    (_item: RoleNavItem, event: React.PointerEvent<HTMLButtonElement>) => {
      dragRef.current = {
        pointerId: event.pointerId,
        sourceHref: _item.href,
        startX: event.clientX,
        startY: event.clientY,
        isDragging: false,
      };
    },
    [],
  );

  const handleActivePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (!drag.isDragging && distance >= DRAG_THRESHOLD_PX) {
        drag.isDragging = true;
        setIsDragging(true);
        setPageAnchored(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      if (!drag.isDragging) {
        return;
      }

      event.preventDefault();
      setIndicatorToPointer(event.clientX, drag.sourceHref);
    },
    [setIndicatorToPointer],
  );

  const handleActivePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      if (drag.isDragging) {
        event.preventDefault();
        const targetHref =
          findNearestSlotHref(event.clientX) ?? drag.sourceHref;

        if (targetHref) {
          syncIndicatorToHref(targetHref);

          if (targetHref !== drag.sourceHref) {
            setCommittedHref(targetHref);
            router.push(targetHref);
          }
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }

      resetDrag();
    },
    [findNearestSlotHref, resetDrag, router, syncIndicatorToHref],
  );

  return (
    <nav
      aria-label="Main navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <div
        ref={trayRef}
        className={`pointer-events-auto overflow-visible ${MOBILE_BOTTOM_NAV_WIDTH_CLASS} ${MOBILE_BOTTOM_NAV_TRAY_CLASS}`}
        onPointerMove={(event) => {
          if (dragRef.current?.isDragging) {
            event.preventDefault();
          }
        }}
      >
        <div aria-hidden className={MOBILE_BOTTOM_NAV_TRAY_SURFACE_CLASS} />
        {indicator ? (
          <div
            aria-hidden="true"
            data-testid="nav-selection-indicator"
            className={`${MOBILE_BOTTOM_NAV_SELECTION_CLASS} ${
              isDragging
                ? "transition-none"
                : "transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
            }`}
            style={{
              left: indicator.left,
              width: indicator.width,
            }}
          />
        ) : null}
        <div className="relative z-10 flex w-full items-center justify-around">
          {navItems.map((item) => (
            <BottomNavSlot
              key={item.href}
              item={item}
              pathname={pathname}
              searchParams={searchParams}
              router={router}
              slotRef={(node) => {
                if (node) {
                  slotRefs.current.set(item.href, node);
                  return;
                }

                slotRefs.current.delete(item.href);
              }}
              onActivePointerDown={(event) =>
                handleActivePointerDown(item, event)
              }
              onActivePointerMove={handleActivePointerMove}
              onActivePointerUp={handleActivePointerEnd}
              onActivePointerCancel={handleActivePointerEnd}
            />
          ))}
          <MobileBottomProfileButton
            role={role}
            fullName={fullName}
            email={email}
          />
        </div>
      </div>
    </nav>
  );
}
