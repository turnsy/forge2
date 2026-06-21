"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

const menuItemClass =
  "flex w-full items-center rounded-lg px-3 py-1.5 text-left text-sm font-medium text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const DropdownMenuContext = createContext<(() => void) | null>(null);

export function Dropdown({
  trigger,
  children,
  align = "end",
  menuLabel,
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    menuId: string;
  }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  menuLabel?: string;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

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
    <DropdownMenuContext.Provider value={closeMenu}>
      <div ref={containerRef} className="relative">
        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label={menuLabel}
            className={[
              "absolute top-full z-50 mt-1 flex min-w-[9rem] flex-col gap-0.5 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface",
              align === "end" ? "right-0" : "left-0",
            ].join(" ")}
          >
            {children}
          </div>
        ) : null}
        {trigger({
          open,
          toggle: () => setOpen((current) => !current),
          menuId,
        })}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownItem({
  children,
  onSelect,
  destructive = false,
}: {
  children: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  const closeMenu = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      role="menuitem"
      className={[
        menuItemClass,
        destructive ? "text-red-400 hover:text-red-300" : "",
      ].join(" ")}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
        closeMenu?.();
      }}
    >
      {children}
    </button>
  );
}
