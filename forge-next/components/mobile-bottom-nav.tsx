"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { GearIcon } from "@/components/icons/gear-icon";
import { LogOutIcon } from "@/components/icons/log-out-icon";
import type { UserRole } from "@/lib/auth/types";
import { isNavItemActive } from "@/lib/navigation/active-path";
import { renderNavIcon } from "@/lib/navigation/nav-icon";
import { profileLabels } from "@/lib/navigation/profile-labels";
import {
  roleNavItems,
  settingsPathForRole,
  type RoleNavItem,
} from "@/lib/navigation/role-nav";
import { roleFocusRingClass } from "@/lib/theme/roles";

const DRAG_THRESHOLD_PX = 10;

const slotClass =
  "relative flex h-11 w-11 items-center justify-center rounded-2xl text-surface-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20";

const slotActiveClass = "bg-glass text-surface-foreground";
const slotDropTargetClass = "bg-glass-focus text-surface-foreground ring-1 ring-white/15";
const slotDraggingClass = "z-10 scale-110 bg-glass text-surface-foreground shadow-lg";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function setPageAnchored(anchored: boolean) {
  if (anchored) {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return;
  }

  document.body.style.overflow = "";
  document.body.style.touchAction = "";
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

    function handlePointerDown(event: MouseEvent) {
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

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Profile menu"
          className="absolute bottom-full right-0 mb-2 flex w-48 flex-col gap-1 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface"
        >
          <Link
            href={settingsPath}
            role="menuitem"
            className={menuItemClass}
            onClick={() => setOpen(false)}
          >
            <GearIcon />
            Settings
          </Link>
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
        className={[
          slotClass,
          roleFocusRingClass(role),
          open ? slotActiveClass : "",
        ].join(" ")}
        onClick={() => setOpen((current) => !current)}
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
  slotRef,
  isDragging,
  isDropTarget,
  onActivePointerDown,
  onActivePointerMove,
  onActivePointerUp,
  onActivePointerCancel,
}: {
  item: RoleNavItem;
  pathname: string;
  slotRef: (node: HTMLButtonElement | HTMLAnchorElement | null) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onActivePointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onActivePointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onActivePointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onActivePointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const active = isNavItemActive(pathname, item.href, item.exact);
  const className = [
    slotClass,
    active && isDragging ? slotDraggingClass : "",
    active && !isDragging ? slotActiveClass : "",
    !active && isDropTarget ? slotDropTargetClass : "",
  ]
    .filter(Boolean)
    .join(" ");

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
      className={[slotClass, isDropTarget ? slotDropTargetClass : ""]
        .filter(Boolean)
        .join(" ")}
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
  const navItems = roleNavItems[role];
  const navRef = useRef<HTMLElement>(null);
  const slotRefs = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<{
    pointerId: number;
    sourceHref: string;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  const [draggingHref, setDraggingHref] = useState<string | null>(null);
  const [dropTargetHref, setDropTargetHref] = useState<string | null>(null);

  const resolveDropTarget = useCallback((clientX: number, clientY: number) => {
    for (const item of navItems) {
      const node = slotRefs.current.get(item.href);
      if (!node) {
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return item.href;
      }
    }

    return null;
  }, [navItems]);

  const resetDrag = useCallback(() => {
    dragRef.current = null;
    setDraggingHref(null);
    setDropTargetHref(null);
    setPageAnchored(false);
  }, []);

  useEffect(() => {
    return () => {
      setPageAnchored(false);
    };
  }, []);

  const handleActivePointerDown = useCallback(
    (item: RoleNavItem, event: React.PointerEvent<HTMLButtonElement>) => {
      dragRef.current = {
        pointerId: event.pointerId,
        sourceHref: item.href,
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
        setDraggingHref(drag.sourceHref);
        setPageAnchored(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      if (!drag.isDragging) {
        return;
      }

      event.preventDefault();
      setDropTargetHref(resolveDropTarget(event.clientX, event.clientY));
    },
    [resolveDropTarget],
  );

  const handleActivePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      if (drag.isDragging) {
        event.preventDefault();
        const targetHref = resolveDropTarget(event.clientX, event.clientY);
        if (targetHref && targetHref !== drag.sourceHref) {
          router.push(targetHref);
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }

      resetDrag();
    },
    [resetDrag, resolveDropTarget, router],
  );

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-8 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <div
        className="pointer-events-auto flex w-full max-w-md touch-none items-center justify-between gap-2 py-1.5"
        onPointerMove={(event) => {
          if (dragRef.current?.isDragging) {
            event.preventDefault();
          }
        }}
      >
        {navItems.map((item) => (
          <BottomNavSlot
            key={item.href}
            item={item}
            pathname={pathname}
            slotRef={(node) => {
              if (node) {
                slotRefs.current.set(item.href, node);
                return;
              }

              slotRefs.current.delete(item.href);
            }}
            isDragging={draggingHref === item.href}
            isDropTarget={
              dropTargetHref === item.href && dropTargetHref !== draggingHref
            }
            onActivePointerDown={(event) => handleActivePointerDown(item, event)}
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
    </nav>
  );
}
