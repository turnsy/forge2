/** Fills the available main-column height for coach workspace panes. */
export const DESKTOP_WORKSPACE_HEIGHT_CLASS = "h-full min-h-0";

/** Collapsed chat rail width — matches the main app sidebar (`w-14`). */
export const DESKTOP_CHAT_COLLAPSED_WIDTH = "3.5rem";

/** Grid transition for the artifact / chat split — matches the main sidebar. */
export const DESKTOP_CHAT_GRID_TRANSITION_CLASS =
  "transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none";

/** Desktop chat column: separated from artifact by border only (no top inset). */
export const DESKTOP_CHAT_COLUMN_CLASS = "border-l border-glass-border";

/** Narrow rail shown when chat is collapsed; keeps the toggle visible. */
export const DESKTOP_CHAT_COLLAPSED_RAIL_CLASS =
  "flex w-14 shrink-0 flex-col items-center border-l border-glass-border px-2 py-4";

/** Inset around the full desktop chat surface (thread, composer, and header). */
export const DESKTOP_CHAT_AREA_CLASS = "p-4";

/** Desktop chat header row for the reset control. */
export const DESKTOP_CHAT_HEADER_CLASS = "flex shrink-0 justify-end pb-2";

/** Expanded split grid: artifact ~67%, chat up to 33%. */
export const DESKTOP_SPLIT_GRID_COLUMNS_EXPANDED =
  "minmax(320px, 1fr) minmax(280px, 33%)";

/** Artifact grid cell — vertical inset only; pane width is set via cqi on the inner wrapper. */
export const DESKTOP_ARTIFACT_COLUMN_CLASS = "py-4 md:py-8";

/** Horizontal inset inside the fixed cqi-width artifact pane. */
export const DESKTOP_ARTIFACT_INNER_PADDING_CLASS = "px-4 md:px-8";

/**
 * Artifact width as a fraction of the split grid — stable across collapse/expand.
 * Uses container query inline units (`@container` on the grid) so the pane does not
 * morph when the artifact column grows while the chat rail collapses.
 */
export const DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS =
  "mx-auto w-[67cqi] shrink-0";
