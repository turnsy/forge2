import {
  MOBILE_BOTTOM_NAV_OFFSET_CLASS,
  MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS,
} from "@/lib/navigation/mobile-bottom-nav-layout";
import { BUTTON_SM_HEIGHT_CLASS } from "@/lib/theme/surfaces";

/** Width reserved for the pinned view button slot in the mobile composer toolbar. */
export const MOBILE_COMPOSER_VIEW_SLOT_CLASS = "w-[5.75rem]";

/** Positions the bordered overlay close control; inset matches mobile page padding. */
export const MOBILE_OVERLAY_CLOSE_CLASS = "absolute right-4 top-1 z-20";

/** Mobile chat header row for the reset control. */
export const MOBILE_CHAT_HEADER_CLASS = "flex shrink-0 justify-end pb-2";

/** Light separation between the view-artifact control and the composer. */
export const MOBILE_VIEW_ARTIFACT_SPACING_CLASS = "pb-2.5";

/** Mobile toolbar row that pairs horizontally scrolling attachments with the view control. */
export const MOBILE_COMPOSER_TOOLBAR_ROW_CLASS = `relative ${BUTTON_SM_HEIGHT_CLASS} ${MOBILE_VIEW_ARTIFACT_SPACING_CLASS}`;

/** Scroll lane for attachment chips; chips can pass under the view control. */
export const MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS =
  "absolute inset-y-0 left-0 right-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Fade + surface mask so attachments disappear behind the pinned view control. */
export const MOBILE_COMPOSER_VIEW_OVERLAY_CLASS =
  `pointer-events-none absolute inset-y-0 right-0 z-10 flex ${MOBILE_COMPOSER_VIEW_SLOT_CLASS} items-center justify-end bg-gradient-to-l from-surface from-55% via-surface/95 to-transparent pl-4`;

/** Reserves vertical space for the overlay close control on mobile only. */
export const MOBILE_OVERLAY_CONTENT_CLASS = "max-md:pt-16";

/** Horizontal page padding for the mobile coach workspace chat surface. */
export const MOBILE_WORKSPACE_X_PADDING_CLASS = "px-4 md:px-0";

/** Full-screen mobile history overlay; covers chat content below the header. */
export const MOBILE_HISTORY_OVERLAY_CLASS =
  "absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-surface";

/** Keeps the prompt composer above the floating bottom nav. */
export const MOBILE_BOTTOM_NAV_COMPOSER_INSET_CLASS =
  MOBILE_BOTTOM_NAV_OFFSET_CLASS;

/** Scroll end inset so artifact content can pass under the bottom nav (mobile only). */
export const MOBILE_BOTTOM_NAV_SCROLL_END_CLASS =
  MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS;
