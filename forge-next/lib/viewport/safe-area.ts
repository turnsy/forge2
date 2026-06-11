/** Keeps interactive content below the status bar / notch. */
export const SAFE_AREA_TOP_CLASS = "pt-[env(safe-area-inset-top,0px)]";

/** Reserves space for the home indicator on sides with edge-to-edge layouts. */
export const SAFE_AREA_X_CLASS =
  "pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]";

/** Full safe-area padding for centered standalone screens (e.g. auth). */
export const SAFE_AREA_PADDING_CLASS =
  "pt-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]";
