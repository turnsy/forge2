import type { PromptMentionSegment } from "@/lib/prompts/mention-types";

export function MentionChip({
  kind,
  label,
}: {
  kind: PromptMentionSegment["kind"];
  label: string;
}) {
  return (
    <span
      className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-coach-border bg-coach-muted/20 px-2 py-0.5 text-sm font-medium text-coach"
      data-mention-kind={kind}
      contentEditable={false}
    >
      @{label}
    </span>
  );
}
