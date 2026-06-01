import { MentionKindIcon } from "@/components/prompt/mention-kind-icon";
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
      className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-glass-border bg-glass px-2 py-0.5 text-sm font-semibold text-surface-foreground"
      data-mention-kind={kind}
      contentEditable={false}
    >
      <MentionKindIcon kind={kind} className="h-3.5 w-3.5 shrink-0 text-surface-muted" />
      {label}
    </span>
  );
}
