"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { UserRole } from "@/lib/auth/types";
import { roleLabel, roleLinkClass } from "@/lib/theme";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="14"
      viewBox="0 0 12 12"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function AuthRoleTitle({
  role,
  onRoleChange,
}: {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const otherRole: UserRole = role === "coach" ? "athlete" : "coach";

  const switchRole = useCallback(() => {
    onRoleChange(otherRole);
    setOpen(false);
  }, [onRoleChange, otherRole]);

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
    <>
      Register as{" "}
      <span ref={containerRef} className="inline-flex flex-col items-start">
        <button
          type="button"
          aria-controls={menuId}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Current role: ${roleLabel(role)}. Switch role.`}
          className={roleLinkClass(role)}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (
              event.key === "ArrowDown" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          {roleLabel(role)}
          <ChevronDownIcon
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <span
          id={menuId}
          role="menu"
          aria-label="Switch role"
          aria-hidden={!open}
          className="mt-1.5"
        >
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            aria-label={`Switch to ${roleLabel(otherRole)}`}
            className={`${roleLinkClass(otherRole)} ${
              open ? "" : "pointer-events-none invisible"
            }`}
            onClick={switchRole}
          >
            {roleLabel(otherRole)}
            <ChevronDownIcon className="invisible" />
          </button>
        </span>
      </span>
    </>
  );
}
