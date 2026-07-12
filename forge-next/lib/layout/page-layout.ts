/** Horizontal inset applied to page and pane content (not outer shells). */
export const PAGE_CONTENT_INSET_X_CLASS = "px-4 md:px-8";

/** Top inset for pane/page chrome rows. */
export const PAGE_CONTENT_INSET_TOP_CLASS = "pt-4 md:pt-8";

/** Combined inset for scrollable pane content below top chrome. */
export const PAGE_SCROLL_CONTENT_INSET_CLASS = `${PAGE_CONTENT_INSET_X_CLASS} ${PAGE_CONTENT_INSET_TOP_CLASS}`;

/** Bottom inset for desktop pane footers (composer/toolbars). */
export const PAGE_CONTENT_INSET_BOTTOM_CLASS = "pb-4 md:pb-8";
