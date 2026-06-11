import type { UserRole } from "@/lib/auth/types";

/** Reserved space for the floating mobile bottom nav + inset + safe area. */
export const MOBILE_BOTTOM_NAV_OFFSET_CLASS =
  "pb-[calc(4.5rem+0.75rem+env(safe-area-inset-bottom,0px))]";

/** Width of the bottom nav tray. */
export const MOBILE_BOTTOM_NAV_WIDTH_CLASS = "w-3/4";

/** Glass surface behind nav icons and profile; darker than the selection pill. */
export const MOBILE_BOTTOM_NAV_TRAY_SURFACE_CLASS =
  "pointer-events-none absolute inset-0 rounded-full border border-glass-border bg-surface/70 shadow-lg backdrop-blur-md";

/** Nav icon row container; overflow visible so the profile menu can open above. */
export const MOBILE_BOTTOM_NAV_TRAY_CLASS =
  "relative flex items-center overflow-visible px-2 py-1.5";

/** Sliding highlight for the active nav icon. */
export const MOBILE_BOTTOM_NAV_SELECTION_CLASS =
  "absolute inset-y-1 z-0 rounded-full bg-glass shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]";

/** Extra width added to the selection pill beyond each slot. */
export const MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX = 12;

/** Coach workspace handles composer inset locally; pages scroll beneath the nav. */
export function shouldReserveMobileBottomNavSpace(
  _role: UserRole,
  _pathname: string,
): boolean {
  return false;
}
