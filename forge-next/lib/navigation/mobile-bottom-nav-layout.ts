import type { UserRole } from "@/lib/auth/types";

/** Reserved space for the floating mobile bottom nav + inset + safe area. */
export const MOBILE_BOTTOM_NAV_OFFSET_CLASS =
  "pb-[calc(4.5rem+0.75rem+env(safe-area-inset-bottom,0px))]";

/** Only the coach workspace prompt keeps content above the bottom nav. */
export function shouldReserveMobileBottomNavSpace(
  role: UserRole,
  pathname: string,
): boolean {
  return role === "coach" && pathname === "/coach";
}
