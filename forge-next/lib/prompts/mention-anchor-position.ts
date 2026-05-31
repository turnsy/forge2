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
