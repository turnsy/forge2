import { createMentionKindIconElement } from "@/lib/prompts/mentions/kind-icon-dom";
import type { PromptMentionSegment, PromptSegment } from "@/lib/prompts/mentions/types";
import { mergeAdjacentTextSegments } from "@/lib/prompts/prompt-document-segments";

export function parseEditorToSegments(root: HTMLElement): PromptSegment[] {
  const segments: PromptSegment[] = [];

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? "";

      if (value.length > 0) {
        segments.push({ type: "text", value });
      }

      continue;
    }

    if (!(node instanceof HTMLElement)) {
      continue;
    }

    if (node.dataset.mentionId && node.dataset.mentionKind && node.dataset.mentionLabel) {
      segments.push({
        type: "mention",
        kind: node.dataset.mentionKind as PromptMentionSegment["kind"],
        id: node.dataset.mentionId,
        label: node.dataset.mentionLabel,
      });
    }
  }

  return mergeAdjacentTextSegments(segments);
}

export function createMentionElement(segment: PromptMentionSegment): HTMLSpanElement {
  const element = document.createElement("span");
  element.dataset.mentionId = segment.id;
  element.dataset.mentionKind = segment.kind;
  element.dataset.mentionLabel = segment.label;
  element.contentEditable = "false";
  element.className =
    "mx-0.5 inline-flex items-center gap-1 rounded-full border border-glass-border bg-glass px-2 py-0.5 text-sm font-semibold text-surface-foreground align-middle";
  element.appendChild(createMentionKindIconElement(segment.kind));
  element.appendChild(document.createTextNode(segment.label));
  return element;
}

export function renderSegmentsToEditor(
  root: HTMLElement,
  segments: PromptSegment[],
): void {
  root.replaceChildren();

  for (const segment of segments) {
    if (segment.type === "text") {
      root.appendChild(document.createTextNode(segment.value));
      continue;
    }

    root.appendChild(createMentionElement(segment));
  }
}
