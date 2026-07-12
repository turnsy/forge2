/** Extra space between scroll content and overlay chrome when scrolled to the end. */
export const OVERLAY_SCROLL_END_GAP_PX = 8;

/** Container for pinned top overlay chrome. */
export const OVERLAY_TOP_CONTAINER_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 z-20";

/** Wraps top chrome content; progressive blur is sized to this row. */
export const OVERLAY_TOP_CHROME_CLASS =
  "relative pointer-events-auto pt-1 pb-2";

/** Pinned footer overlay for toolbars, composers, and bottom chrome. */
export const OVERLAY_FOOTER_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col";

/** Zone where progressive blur extends through bottom chrome. */
export const OVERLAY_BOTTOM_BLUR_ZONE_CLASS = "relative";

/** Separation between a pre-footer toolbar and the main footer. */
export const OVERLAY_PRE_FOOTER_SPACING_CLASS = "mb-2";

/** Toolbar row wrapper above a footer in overlay layouts. */
export const OVERLAY_PRE_FOOTER_CLASS = `relative z-10 pointer-events-auto ${OVERLAY_PRE_FOOTER_SPACING_CLASS}`;
