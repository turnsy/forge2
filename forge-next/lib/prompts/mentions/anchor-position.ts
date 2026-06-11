export type MentionAnchorPoint = {
  top: number;
  left: number;
};

export function buildMirrorTextBeforeAnchor(
  linearText: string,
  anchorIndex: number,
): { before: string; marker: string } {
  return {
    before: linearText.slice(0, anchorIndex),
    marker: linearText[anchorIndex] ?? "@",
  };
}

export function getMentionAnchorPoint(
  _mirrorElement: HTMLElement,
  markerElement: HTMLElement,
): MentionAnchorPoint {
  const markerRect = markerElement.getBoundingClientRect();

  return {
    top: markerRect.top,
    left: markerRect.left,
  };
}

export function shouldFlipMenuAbove(
  anchorTop: number,
  menuHeight: number,
  viewportHeight: number,
  padding = 8,
): boolean {
  return anchorTop + menuHeight + padding > viewportHeight;
}

export type MentionMenuPlacement = "above" | "below";

export type MentionMenuAnchor = {
  top: number;
  left: number;
  placement: MentionMenuPlacement;
};

/** Position the menu below the caret, or above with bottom-edge anchoring. */
export function buildMentionMenuAnchor(
  point: { top: number; bottom: number; left: number },
  options: {
    maxMenuHeight: number;
    offset: number;
    viewportHeight: number;
  },
): MentionMenuAnchor {
  const placement = shouldFlipMenuAbove(
    point.bottom + options.offset,
    options.maxMenuHeight,
    options.viewportHeight,
  )
    ? "above"
    : "below";

  return {
    top:
      placement === "above"
        ? point.top - options.offset
        : point.bottom + options.offset,
    left: point.left,
    placement,
  };
}

export function mentionMenuAnchorStyle(
  anchor: MentionMenuAnchor,
): { top: number; left: number; transform?: string } {
  return {
    top: anchor.top,
    left: anchor.left,
    ...(anchor.placement === "above" ? { transform: "translateY(-100%)" } : {}),
  };
}
