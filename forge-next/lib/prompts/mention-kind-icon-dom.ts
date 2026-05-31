import type { PromptMentionItem } from "@/lib/prompts/mention-types";

const svgAttributes = {
  "aria-hidden": "true",
  fill: "none",
  stroke: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "stroke-width": "1.75",
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

function createSvgIcon(className: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  for (const [key, value] of Object.entries(svgAttributes)) {
    svg.setAttribute(key, value);
  }

  svg.setAttribute("class", className);
  return svg;
}

function appendPath(svg: SVGSVGElement, pathData: string) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  svg.appendChild(path);
}

export function createMentionKindIconElement(
  kind: PromptMentionItem["kind"],
  className = "h-3.5 w-3.5 shrink-0 text-surface-muted",
): SVGSVGElement {
  const svg = createSvgIcon(className);

  if (kind === "athlete") {
    appendPath(svg, "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "9");
    circle.setAttribute("cy", "7");
    circle.setAttribute("r", "4");
    svg.appendChild(circle);
    appendPath(svg, "M22 21v-2a4 4 0 0 0-3-3.87");
    appendPath(svg, "M16 3.13a4 4 0 0 1 0 7.75");
    return svg;
  }

  appendPath(svg, "M8 6h13");
  appendPath(svg, "M8 12h13");
  appendPath(svg, "M8 18h13");
  appendPath(svg, "M3 6h.01");
  appendPath(svg, "M3 12h.01");
  appendPath(svg, "M3 18h.01");
  return svg;
}
