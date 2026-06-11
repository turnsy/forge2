import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

/** Positions the bordered overlay close control below the safe area inset. */
export const MOBILE_OVERLAY_CLOSE_CLASS = "absolute right-0 top-1 z-20";

/** Reserves vertical space for the overlay close control; roomier on mobile. */
export const MOBILE_OVERLAY_CONTENT_CLASS = "pt-16 md:pt-14";

/** Horizontal page padding for the mobile coach workspace chat surface. */
export const MOBILE_WORKSPACE_X_PADDING_CLASS = "px-4 md:px-0";

/** Keeps the prompt composer above the floating bottom nav. */
export const MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS =
  MOBILE_BOTTOM_NAV_OFFSET_CLASS;

/** Scroll end inset so artifact content can pass under the bottom nav. */
export const MOBILE_BOTTOM_NAV_SCROLL_END_CLASS =
  MOBILE_BOTTOM_NAV_OFFSET_CLASS;
