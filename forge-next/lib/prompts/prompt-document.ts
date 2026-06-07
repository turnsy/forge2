import type {
  ActiveMentionQuery,
  PromptMentionItem,
  PromptSegment,
} from "@/lib/prompts/mentions/types";
import { mergeAdjacentTextSegments } from "@/lib/prompts/prompt-document-segments";

/** Space + zero-width space keeps a visible caret anchor after chips in contenteditable. */
export const MENTION_TRAILING_TEXT = " \u200B";

export function normalizePromptText(value: string): string {
  return value.replace(/\u200B/g, "");
}

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
  const textLength = getLinearText(segments).length;

  if (caretIndex < 0 || caretIndex > textLength) {
    return null;
  }

  let index = 0;

  for (const segment of segments) {
    if (segment.type === "mention") {
      index += `@${segment.label}`.length;
      continue;
    }

    const segmentStart = index;
    const segmentEnd = segmentStart + segment.value.length;
    index = segmentEnd;

    if (caretIndex <= segmentStart || caretIndex > segmentEnd) {
      continue;
    }

    const localCaret = caretIndex - segmentStart;
    const textBeforeCaret = segment.value.slice(0, localCaret);
    const atIndex = textBeforeCaret.lastIndexOf("@");

    if (atIndex === -1) {
      return null;
    }

    const query = textBeforeCaret.slice(atIndex + 1);
    const charBeforeAt = atIndex > 0 ? textBeforeCaret[atIndex - 1] : "";

    if (charBeforeAt && /[^\s]/.test(charBeforeAt)) {
      return null;
    }

    return {
      start: segmentStart + atIndex,
      query,
      end: caretIndex,
    };
  }

  return null;
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
    { type: "text", value: MENTION_TRAILING_TEXT },
  ]);
}

export function getCaretIndexAfterMentionInsert(
  mentionStart: number,
  label: string,
): number {
  return mentionStart + `@${label}`.length + MENTION_TRAILING_TEXT.length;
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

export function serializeMentionForAgent(
  segment: Extract<PromptSegment, { type: "mention" }>,
): string {
  return `@${segment.label} {"kind":"${segment.kind}","id":"${segment.id}"}`;
}

export function serializePromptForAgent(segments: PromptSegment[]): string {
  return normalizePromptText(
    segments
      .map((segment) =>
        segment.type === "text"
          ? segment.value
          : serializeMentionForAgent(segment),
      )
      .join(""),
  );
}

export function serializePromptDocument(segments: PromptSegment[]): string {
  return normalizePromptText(getLinearText(segments));
}

export function isEmptyDocument(segments: PromptSegment[]): boolean {
  return normalizePromptText(getLinearText(segments)).trim().length === 0;
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
