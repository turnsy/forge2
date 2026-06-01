import { DESKTOP_MIN_WIDTH_PX } from "@/lib/viewport/breakpoints";

export function matchesMinWidth(width: number, minWidth: number): boolean {
  return width >= minWidth;
}

export function desktopMediaQuery(minWidth = DESKTOP_MIN_WIDTH_PX): string {
  return `(min-width: ${minWidth}px)`;
}

export function isDesktopWidth(
  width: number,
  minWidth = DESKTOP_MIN_WIDTH_PX,
): boolean {
  return matchesMinWidth(width, minWidth);
}
