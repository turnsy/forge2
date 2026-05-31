import type {
  ActiveMentionQuery,
  PromptMentionItem,
  PromptSegment,
} from "@/lib/prompts/mention-types";
import { mergeAdjacentTextSegments } from "@/lib/prompts/prompt-document-segments";

export function getLinearText(segments: PromptSegment[]): string {
  return segments
    .map((segment) =>
      segment.type === "text" ? segment.value : `@${segment.label}`,
    )
    .join("");
}

export function getActiveMentionQuery(
  segments: PromptSegment[],
  caretIndex: number,
): ActiveMentionQuery | null {
  const text = getLinearText(segments);

  if (caretIndex < 0 || caretIndex > text.length) {
    return null;
  }

  const beforeCaret = text.slice(0, caretIndex);
  const atIndex = beforeCaret.lastIndexOf("@");

  if (atIndex === -1) {
    return null;
  }

  const query = beforeCaret.slice(atIndex + 1);

  if (/\s/.test(query)) {
    return null;
  }

  const charBeforeAt = atIndex > 0 ? beforeCaret[atIndex - 1] : "";
  if (charBeforeAt && /[^\s]/.test(charBeforeAt)) {
    return null;
  }

  return {
    start: atIndex,
    query,
    end: caretIndex,
  };
}

function mentionMatchScore(label: string, query: string): number | null {
  const normalizedLabel = label.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.length === 0) {
    return 0;
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return 2;
  }

  if (normalizedLabel.includes(normalizedQuery)) {
    return 1;
  }

  return null;
}

export function searchMentionItems(
  items: PromptMentionItem[],
  query: string,
  limit = 4,
): PromptMentionItem[] {
  const ranked = items
    .map((item) => ({
      item,
      score: mentionMatchScore(item.label, query),
    }))
    .filter(
      (entry): entry is { item: PromptMentionItem; score: number } =>
        entry.score !== null,
    )
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.item.label.localeCompare(right.item.label);
    });

  return ranked.slice(0, limit).map((entry) => entry.item);
}


function replaceRangeInSegments(
  segments: PromptSegment[],
  start: number,
  end: number,
  replacement: PromptSegment[],
): PromptSegment[] {
  const next: PromptSegment[] = [];
  let index = 0;

  for (const segment of segments) {
    const segmentText =
      segment.type === "text" ? segment.value : `@${segment.label}`;
    const segmentStart = index;
    const segmentEnd = segmentStart + segmentText.length;
    index = segmentEnd;

    if (segmentEnd < start || segmentStart > end) {
      next.push(segment);
      continue;
    }

    if (segment.type === "mention") {
      throw new Error("Cannot replace inside a mention segment");
    }

    const localStart = Math.max(0, start - segmentStart);
    const localEnd = Math.min(segment.value.length, end - segmentStart);
    const before = segment.value.slice(0, localStart);
    const after = segment.value.slice(localEnd);

    if (before) {
      next.push({ type: "text", value: before });
    }

    next.push(...replacement);

    if (after) {
      next.push({ type: "text", value: after });
    }
  }

  return mergeAdjacentTextSegments(next);
}

export function insertMentionChip(
  segments: PromptSegment[],
  range: Pick<ActiveMentionQuery, "start" | "end">,
  item: PromptMentionItem,
): PromptSegment[] {
  const mentionSegment: PromptSegment = {
    type: "mention",
    kind: item.kind,
    id: item.id,
    label: item.label,
  };

  return replaceRangeInSegments(segments, range.start, range.end, [
    mentionSegment,
    { type: "text", value: " " },
  ]);
}

export function deleteMentionBeforeCaret(
  segments: PromptSegment[],
  caretIndex: number,
): { segments: PromptSegment[]; caretIndex: number } | null {
  const text = getLinearText(segments);
  if (caretIndex <= 0) {
    return null;
  }

  let index = 0;

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
    const segment = segments[segmentIndex];
    const segmentText =
      segment.type === "text" ? segment.value : `@${segment.label}`;
    const segmentStart = index;
    const segmentEnd = segmentStart + segmentText.length;

    if (segment.type === "mention" && caretIndex === segmentEnd) {
      const nextSegments = segments.filter((_, i) => i !== segmentIndex);
      return {
        segments: mergeAdjacentTextSegments(nextSegments),
        caretIndex: segmentStart,
      };
    }

    index = segmentEnd;
  }

  if (text[caretIndex - 1] === " ") {
    return {
      segments: replaceRangeInSegments(
        segments,
        caretIndex - 1,
        caretIndex,
        [],
      ),
      caretIndex: caretIndex - 1,
    };
  }

  return null;
}

export function serializePromptDocument(segments: PromptSegment[]): string {
  return getLinearText(segments);
}

export function isEmptyDocument(segments: PromptSegment[]): boolean {
  return serializePromptDocument(segments).trim().length === 0;
}

export function createTextDocument(value: string): PromptSegment[] {
  if (value.length === 0) {
    return [];
  }

  return [{ type: "text", value }];
}

export function updateTextAtRange(
  segments: PromptSegment[],
  start: number,
  end: number,
  replacement: string,
): PromptSegment[] {
  return replaceRangeInSegments(segments, start, end, createTextDocument(replacement));
}
