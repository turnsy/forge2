"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { GearIcon } from "@/components/icons/gear-icon";
import { LogOutIcon } from "@/components/icons/log-out-icon";
import type { UserRole } from "@/lib/auth/types";
import { settingsPathForRole } from "@/lib/navigation/role-nav";
import { profileLabels } from "@/lib/navigation/profile-labels";
import { roleFocusRingClass, roleMutedBorderClass } from "@/lib/theme/roles";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function SidebarProfileMenu({
  role,
  fullName,
  email,
  collapsed = false,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | undefined;
  collapsed?: boolean;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { displayName, displayEmail } = profileLabels(fullName, email);
  const settingsPath = settingsPathForRole(role);
  const profileToggleClass = collapsed
    ? [
        "flex w-full items-center justify-center rounded-xl p-2 text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        roleFocusRingClass(role),
        open ? "bg-glass text-surface-foreground" : "",
      ].join(" ")
    : [
        "flex w-full items-center gap-2 rounded-xl border px-4 py-2 text-left glass-surface transition hover:bg-glass-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        roleMutedBorderClass(role),
        roleFocusRingClass(role),
        open ? "bg-glass-focus" : "",
      ].join(" ");

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
          className={[
            "absolute bottom-full mb-1 flex flex-col gap-1 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface",
            collapsed ? "left-0 w-48" : "left-0 right-0",
          ].join(" ")}
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
        className={profileToggleClass}
        onClick={() => setOpen((current) => !current)}
      >
        {collapsed ? (
          <ChevronUpIcon
            className={`h-4 w-4 transition-transform${open ? " rotate-180" : ""}`}
          />
        ) : (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-surface-foreground">
                {displayName}
              </span>
              {displayEmail ? (
                <span className="block truncate text-xs text-surface-muted">
                  {displayEmail}
                </span>
              ) : null}
            </span>
            <ChevronUpIcon
              className={`text-surface-muted transition-transform${open ? " rotate-180" : ""}`}
            />
          </>
        )}
      </button>
    </div>
  );
}
