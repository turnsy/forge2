import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MentionKindIcon } from "@/components/prompt/mention-kind-icon";
import type { PromptMentionItem } from "@/lib/prompts/mentions/types";

export function createMentionKindIconElement(
  kind: PromptMentionItem["kind"],
  className = "h-3.5 w-3.5 shrink-0 text-surface-muted",
): SVGSVGElement {
  const markup = renderToStaticMarkup(
    createElement(MentionKindIcon, { kind, className }),
  );
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const icon = template.content.firstElementChild;

  if (!(icon instanceof SVGSVGElement)) {
    throw new Error("Expected mention kind icon to render as SVG");
  }

  return icon;
}
