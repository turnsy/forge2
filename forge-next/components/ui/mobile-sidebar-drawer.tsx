"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SidebarToggleIcon } from "@/components/icons/sidebar-toggle-icon";

const CloseMobileSidebarContext = createContext<(() => void) | undefined>(undefined);
export function useCloseMobileSidebar() { return useContext(CloseMobileSidebarContext); }

/** Mobile shell for the same navigation used on desktop. Native dialog traps focus. */
export function MobileSidebarDrawer({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const route = `${pathname}?${search}`;
  const previousRoute = useRef(route);

  useEffect(() => {
    if (previousRoute.current !== route) {
      previousRoute.current = route;
      dialogRef.current?.close();
    }
  }, [route]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    let start: { x: number; y: number; opening: boolean } | null = null;
    function onStart(event: TouchEvent) {
      if (event.touches.length !== 1) { start = null; return; }
      const touch = event.touches[0];
      const opening = !dialogRef.current?.open;
      start = !opening || touch.clientX <= 24
        ? { x: touch.clientX, y: touch.clientY, opening } : null;
    }
    function onEnd(event: TouchEvent) {
      if (!start || !event.changedTouches.length) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (start.opening && dx > 0) {
          dialogRef.current?.showModal();
          setOpen(true);
        } else if (!start.opening && dx < 0) {
          dialogRef.current?.close();
        }
      }
      start = null;
    }
    function onCancel() { start = null; }
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open sidebar"
        aria-controls={id}
        aria-expanded={open}
        className="fixed left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-surface/90 text-surface-foreground shadow-sm backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => { dialogRef.current?.showModal(); setOpen(true); }}
      >
        <SidebarToggleIcon />
      </button>
      <dialog
        ref={dialogRef}
        id={id}
        aria-label="Main navigation"
        className="dark fixed inset-y-0 left-0 m-0 h-dvh max-h-none max-w-none overflow-visible border-0 bg-surface p-0 text-surface-foreground backdrop:bg-black/50 open:flex starting:-translate-x-full transition-transform duration-200 ease-out motion-reduce:transition-none"
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.closest("a[href]")) {
            dialogRef.current?.close();
          }
        }}
      >
        <CloseMobileSidebarContext.Provider value={() => dialogRef.current?.close()}>
          {children}
        </CloseMobileSidebarContext.Provider>
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute right-3 top-[max(1rem,env(safe-area-inset-top))] flex h-8 w-8 items-center justify-center rounded-lg hover:bg-glass focus-visible:outline-2"
          onClick={() => dialogRef.current?.close()}
        >
          <SidebarToggleIcon />
        </button>
      </dialog>
    </>
  );
}
