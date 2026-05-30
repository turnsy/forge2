"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { loginPathForRole, signupPathForRole } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";

const ROLE_LABELS: Record<UserRole, string> = {
  coach: "Coach",
  athlete: "Athlete",
};

const roleLinkClassName = (role: UserRole) =>
  `inline-flex items-center gap-0.5 underline decoration-2 underline-offset-[6px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
    role === "coach"
      ? "text-red-400 decoration-red-400/40 hover:text-red-300 focus-visible:ring-red-500/50"
      : "text-green-400 decoration-green-400/40 hover:text-green-300 focus-visible:ring-green-500/50"
  }`;

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
  mode,
}: {
  role: UserRole;
  mode: "sign-in" | "sign-up";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const otherRole: UserRole = role === "coach" ? "athlete" : "coach";
  const prefix = mode === "sign-in" ? "Sign in as" : "Register as";
  const pathForRole = mode === "sign-in" ? loginPathForRole : signupPathForRole;

  const switchRole = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    const path = pathForRole(otherRole);
    router.push(query ? `${path}?${query}` : path);
    setOpen(false);
  }, [otherRole, pathForRole, router, searchParams]);

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
      {prefix}{" "}
      <span ref={containerRef} className="inline-flex flex-col items-start">
        <button
          type="button"
          aria-controls={menuId}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Current role: ${ROLE_LABELS[role]}. Switch role.`}
          className={roleLinkClassName(role)}
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
          {ROLE_LABELS[role]}
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
            aria-label={`Switch to ${ROLE_LABELS[otherRole]}`}
            className={`${roleLinkClassName(otherRole)} ${
              open ? "" : "pointer-events-none invisible"
            }`}
            onClick={switchRole}
          >
            {ROLE_LABELS[otherRole]}
            <ChevronDownIcon className="invisible" />
          </button>
        </span>
      </span>
    </>
  );
}
