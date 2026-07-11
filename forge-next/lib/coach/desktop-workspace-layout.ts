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

/** Artifact width when chat is collapsed — matches the ~2:1 expanded split. */
export const DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS = "w-2/3";

/** Smooth width change when the chat rail collapses or expands. */
export const DESKTOP_ARTIFACT_WIDTH_TRANSITION_CLASS =
  "transition-[width] duration-200 ease-out motion-reduce:transition-none";
