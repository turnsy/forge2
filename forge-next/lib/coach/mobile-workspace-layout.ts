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

/** Tighter separation between the toolbar and prompt in overlay chat. */
export const MOBILE_COMPOSER_TOOLBAR_OVERLAY_SPACING_CLASS = "mb-2";

/** Toolbar row wrapper in overlay chat; keeps spacing above the prompt. */
export const MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS = `relative z-10 pointer-events-auto ${MOBILE_COMPOSER_TOOLBAR_OVERLAY_SPACING_CLASS}`;

/** Mobile toolbar row that pairs horizontally scrolling attachments with the view control. */
export const MOBILE_COMPOSER_TOOLBAR_ROW_CLASS = `relative ${BUTTON_SM_HEIGHT_CLASS}`;

/** Container for the top history control. */
export const MOBILE_CHAT_TOP_OVERLAY_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 z-20";

/** Wraps the history control; progressive blur is sized to this row only. */
export const MOBILE_CHAT_TOP_CHROME_CLASS =
  "relative pointer-events-auto pt-1 pb-2";

/** Pinned footer for the composer toolbar and prompt on mobile overlay chat. */
export const MOBILE_CHAT_FOOTER_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col";

/** Zone where progressive blur extends from the toolbar or prompt through the bottom nav. */
export const MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS = "relative";

/** Darker glass surface for the overlay prompt card (input + actions). */
export const MOBILE_CHAT_COMPOSER_INPUT_SURFACE_CLASS =
  "rounded-card border border-glass-border bg-surface/80 backdrop-blur-md shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]";

/** Extra space between the last message and overlay chrome when scrolled to the end. */
export const MOBILE_CHAT_SCROLL_END_GAP_PX = 8;

/** Reserved height for the floating bottom nav + inset + safe area. */
const MOBILE_BOTTOM_NAV_CLEARANCE =
  "4.5rem+0.75rem+env(safe-area-inset-bottom,0px)";

/** Approximate compact mobile composer block height (fallback before measurement). */
const MOBILE_COMPOSER_BLOCK_HEIGHT = "7.5rem";

/** Toolbar row height; matches BUTTON_SM_HEIGHT_CLASS. */
const MOBILE_TOOLBAR_BLOCK_HEIGHT = "2rem";

/** Scroll inset so the first message clears the top overlay (fallback). */
export const MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS = "max-md:pt-12";

/** Scroll end inset so the last message rests above the prompt and nav. */
export const MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS = `max-md:pb-[calc(${MOBILE_COMPOSER_BLOCK_HEIGHT}+${MOBILE_BOTTOM_NAV_CLEARANCE})]`;

/** Extra scroll inset when the attachment/view toolbar is shown. */
export const MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS = `max-md:pb-[calc(${MOBILE_TOOLBAR_BLOCK_HEIGHT}+${MOBILE_COMPOSER_BLOCK_HEIGHT}+${MOBILE_BOTTOM_NAV_CLEARANCE})]`;

/** Horizontal inset for mobile overlay chat content and chrome. */
export const MOBILE_CHAT_CONTENT_INSET_X_CLASS = "max-md:px-4";

/** Scroll lane for attachment chips; chips can pass under the view control. */
export const MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS =
  "absolute inset-y-0 left-0 right-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Pins the view control on the right edge of the toolbar row. */
export const MOBILE_COMPOSER_VIEW_CONTROL_CLASS = `pointer-events-auto absolute inset-y-0 right-0 z-10 flex ${MOBILE_COMPOSER_VIEW_SLOT_CLASS} items-center justify-end`;

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
