import {
  OVERLAY_BOTTOM_BLUR_ZONE_CLASS,
  OVERLAY_FOOTER_CLASS,
  OVERLAY_PRE_FOOTER_CLASS,
  OVERLAY_PRE_FOOTER_SPACING_CLASS,
  OVERLAY_SCROLL_END_GAP_PX,
} from "@/lib/layout/overlay-scroll-chrome-layout";
import { BUTTON_SM_HEIGHT_CLASS } from "@/lib/theme/surfaces";

/** Width reserved for the pinned view button slot in the mobile composer toolbar. */
export const MOBILE_COMPOSER_VIEW_SLOT_CLASS = "w-[5.75rem]";

/** Separation between the attachment/view toolbar and the prompt (non-overlay layouts). */
export const MOBILE_VIEW_ARTIFACT_SPACING_CLASS = "mb-4";

/** Tighter separation between the toolbar and prompt in overlay chat. */
export const MOBILE_COMPOSER_TOOLBAR_OVERLAY_SPACING_CLASS = OVERLAY_PRE_FOOTER_SPACING_CLASS;

/** Toolbar row wrapper in overlay chat; keeps spacing above the prompt. */
export const MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS = OVERLAY_PRE_FOOTER_CLASS;

/** Mobile toolbar row that pairs horizontally scrolling attachments with the view control. */
export const MOBILE_COMPOSER_TOOLBAR_ROW_CLASS = `relative ${BUTTON_SM_HEIGHT_CLASS}`;

/** Pinned footer for the composer toolbar and prompt on mobile overlay chat. */
export const MOBILE_CHAT_FOOTER_CLASS = OVERLAY_FOOTER_CLASS;

/** Zone where progressive blur extends from the toolbar or prompt to the bottom edge. */
export const MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS = OVERLAY_BOTTOM_BLUR_ZONE_CLASS;

/** Darker glass surface for the overlay prompt card (input + actions). */
export const MOBILE_CHAT_COMPOSER_INPUT_SURFACE_CLASS =
  "rounded-card border border-glass-border bg-surface/80 backdrop-blur-md shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]";

/** Extra space between the last message and overlay chrome when scrolled to the end. */
export const MOBILE_CHAT_SCROLL_END_GAP_PX = OVERLAY_SCROLL_END_GAP_PX;

/** Reserved height for the bottom inset + safe area. */
const MOBILE_BOTTOM_CLEARANCE =
  "1rem+env(safe-area-inset-bottom,0px)";

/** Approximate compact mobile composer block height (fallback before measurement). */
const MOBILE_COMPOSER_BLOCK_HEIGHT = "7.5rem";

/** Toolbar row height; matches BUTTON_SM_HEIGHT_CLASS. */
const MOBILE_TOOLBAR_BLOCK_HEIGHT = "2rem";

/** Scroll inset so the first message clears fallback top chrome. */
export const CHAT_THREAD_FALLBACK_TOP_CLASS = "pt-4 md:pt-6";

/** Extra breathing room below measured overlay top chrome. */
export const CHAT_THREAD_OVERLAY_TOP_GAP_CLASS = "pt-2";

/** @deprecated Use CHAT_THREAD_FALLBACK_TOP_CLASS */
export const MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS = CHAT_THREAD_FALLBACK_TOP_CLASS;

/** Scroll end inset so the last message rests above the prompt. */
export const MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS = `max-md:pb-[calc(${MOBILE_COMPOSER_BLOCK_HEIGHT}+${MOBILE_BOTTOM_CLEARANCE})]`;

/** Extra scroll inset when the attachment/view toolbar is shown. */
export const MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS = `max-md:pb-[calc(${MOBILE_TOOLBAR_BLOCK_HEIGHT}+${MOBILE_COMPOSER_BLOCK_HEIGHT}+${MOBILE_BOTTOM_CLEARANCE})]`;

/** Horizontal inset for mobile overlay chat content and chrome. */
export const MOBILE_CHAT_CONTENT_INSET_X_CLASS = "max-md:px-4";

/** Scroll lane for attachment chips; chips can pass under the view control. */
export const MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS =
  "absolute inset-y-0 left-0 right-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Pins the view control on the right edge of the toolbar row. */
export const MOBILE_COMPOSER_VIEW_CONTROL_CLASS = `pointer-events-auto absolute inset-y-0 right-0 z-10 flex ${MOBILE_COMPOSER_VIEW_SLOT_CLASS} items-center justify-end`;

/** Safe-area spacing beneath mobile composers and artifact content. */
export const MOBILE_COMPOSER_INSET_CLASS = "pb-[max(1rem,env(safe-area-inset-bottom,0px))]";
export const MOBILE_SCROLL_END_CLASS = "max-md:pb-[max(1rem,env(safe-area-inset-bottom,0px))]";
