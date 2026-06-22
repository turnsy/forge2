"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const menuItemClass =
  "flex w-full items-center rounded-lg px-3 py-1.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const defaultMenuItemClass =
  `${menuItemClass} text-surface-muted hover:bg-glass hover:text-surface-foreground`;

const destructiveMenuItemClass =
  `${menuItemClass} !text-danger hover:bg-danger-muted/40 hover:!text-danger`;

const DropdownMenuContext = createContext<(() => void) | null>(null);

type MenuPosition = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

function getMenuPosition(
  anchor: DOMRect,
  side: "top" | "bottom",
  align: "start" | "end",
): MenuPosition {
  const offset = 4;

  const position: MenuPosition =
    side === "top"
      ? { bottom: window.innerHeight - anchor.top + offset }
      : { top: anchor.bottom + offset };

  if (align === "end") {
    position.right = window.innerWidth - anchor.right;
  } else {
    position.left = anchor.left;
  }

  return position;
}

export function Dropdown({
  trigger,
  children,
  align = "end",
  side = "bottom",
  menuLabel,
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    menuId: string;
    triggerRef: React.RefObject<HTMLDivElement | null>;
  }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  menuLabel?: string;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const closeMenu = () => setOpen(false);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    setMenuPosition(
      getMenuPosition(triggerRef.current.getBoundingClientRect(), side, align),
    );
  }, [align, side]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        document.getElementById(menuId)?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleReposition() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [menuId, open, updateMenuPosition]);

  const menuStyle: CSSProperties | undefined = menuPosition
    ? {
        position: "fixed",
        zIndex: 200,
        ...menuPosition,
      }
    : undefined;

  const menu =
    open && menuPosition && typeof document !== "undefined" ? (
      createPortal(
        <div
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          style={menuStyle}
          className="flex min-w-[9rem] flex-col gap-0.5 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface"
        >
          {children}
        </div>,
        document.body,
      )
    ) : null;

  return (
    <DropdownMenuContext.Provider value={closeMenu}>
      <div ref={containerRef} className="relative">
        {menu}
        <div ref={triggerRef} className="inline-flex">
          {trigger({
            open,
            toggle: () => setOpen((current) => !current),
            menuId,
            triggerRef,
          })}
        </div>
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
      className={destructive ? destructiveMenuItemClass : defaultMenuItemClass}
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
