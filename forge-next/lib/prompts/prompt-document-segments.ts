import type { PromptSegment } from "@/lib/prompts/mention-types";

export function mergeAdjacentTextSegments(segments: PromptSegment[]): PromptSegment[] {
  const merged: PromptSegment[] = [];

  for (const segment of segments) {
    const previous = merged.at(-1);

    if (
      segment.type === "text" &&
      previous?.type === "text" &&
      previous.value.length > 0 &&
      segment.value.length > 0
    ) {
      previous.value += segment.value;
      continue;
    }

    if (segment.type === "text" && segment.value.length === 0) {
      continue;
    }

    merged.push(
      segment.type === "text" ? { type: "text", value: segment.value } : segment,
    );
  }

  return merged;
}
