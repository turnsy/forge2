/** Fills the available main-column height for coach workspace panes. */
export const DESKTOP_WORKSPACE_HEIGHT_CLASS = "h-full min-h-0";

/** Collapsed chat rail width — matches the main app sidebar (`w-14`). */
export const DESKTOP_CHAT_COLLAPSED_WIDTH = "3.5rem";

/** Grid transition for the artifact / chat split — matches the main sidebar. */
export const DESKTOP_CHAT_GRID_TRANSITION_CLASS =
  "transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none";

/** Desktop chat column: separated from artifact by border only. */
export const DESKTOP_CHAT_COLUMN_CLASS =
  "flex min-h-0 flex-col border-l border-glass-border";

/** Narrow rail shown when chat is collapsed; keeps the toggle visible. */
export const DESKTOP_CHAT_COLLAPSED_RAIL_CLASS =
  "flex w-14 shrink-0 flex-col items-center border-l border-glass-border px-3 py-4";

/** Toggle row aligned with the main app sidebar header (`px-3 py-4`). */
export const DESKTOP_CHAT_TOGGLE_ROW_CLASS =
  "flex shrink-0 items-center justify-end px-3 py-4";

/** Expanded split grid: artifact ~67%, chat up to 33%. */
export const DESKTOP_SPLIT_GRID_COLUMNS_EXPANDED =
  "minmax(320px, 1fr) minmax(280px, 33%)";

/** Artifact grid cell — full bleed within the split pane. */
export const DESKTOP_ARTIFACT_COLUMN_CLASS = "min-w-0";

/** Artifact pane fills the grid cell edge-to-edge. */
export const DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS =
  "flex min-h-0 w-full min-w-0 flex-1 flex-col";
