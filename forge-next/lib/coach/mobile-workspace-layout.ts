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

/** Separation between the attachment/view toolbar and the prompt (non-overlay layouts). */
export const MOBILE_VIEW_ARTIFACT_SPACING_CLASS = "mb-4";

/** Mobile toolbar row that pairs horizontally scrolling attachments with the view control. */
export const MOBILE_COMPOSER_TOOLBAR_ROW_CLASS = `relative ${BUTTON_SM_HEIGHT_CLASS}`;

/** Soft light fades for mobile scroll-under chrome on dark surfaces. */
export const MOBILE_CHAT_SCROLL_FADE_FROM_CLASS = "from-white/12";
export const MOBILE_CHAT_SCROLL_FADE_VIA_CLASS = "via-white/6";

/** Container for the top history control. */
export const MOBILE_CHAT_TOP_OVERLAY_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 z-20 pt-1";

/** Light fade behind the history control; conversation scrolls underneath. */
export const MOBILE_CHAT_TOP_FADE_CLASS = `pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${MOBILE_CHAT_SCROLL_FADE_FROM_CLASS} ${MOBILE_CHAT_SCROLL_FADE_VIA_CLASS} to-transparent`;

/** Pinned footer for the composer toolbar and prompt on mobile overlay chat. */
export const MOBILE_CHAT_FOOTER_CLASS =
  "absolute inset-x-0 bottom-0 z-20 flex flex-col";

/** Light fade between the attachment/view toolbar and the prompt. */
export const MOBILE_CHAT_TOOLBAR_TO_COMPOSER_FADE_CLASS = `pointer-events-none h-8 shrink-0 bg-gradient-to-b from-transparent ${MOBILE_CHAT_SCROLL_FADE_VIA_CLASS} to-white/12`;

/** Scroll inset so the first message clears the top overlay. */
export const MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS = "max-md:pt-14";

/** Scroll inset so messages can pass under the composer footer. */
export const MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS = "max-md:pb-36";

/** Extra scroll inset when the attachment/view toolbar is shown. */
export const MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS =
  "max-md:pb-44";

/** Padding around the prompt inside the mobile overlay footer. */
export const MOBILE_CHAT_COMPOSER_SURFACE_CLASS = "bg-surface pt-3";

/** Scroll lane for attachment chips; chips can pass under the view control. */
export const MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS =
  "absolute inset-y-0 left-0 right-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Fade + light mask so attachments disappear behind the pinned view control. */
export const MOBILE_COMPOSER_VIEW_OVERLAY_CLASS =
  `pointer-events-none absolute inset-y-0 right-0 z-10 flex ${MOBILE_COMPOSER_VIEW_SLOT_CLASS} items-center justify-end bg-gradient-to-l ${MOBILE_CHAT_SCROLL_FADE_FROM_CLASS} ${MOBILE_CHAT_SCROLL_FADE_VIA_CLASS} to-transparent pl-4`;

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
