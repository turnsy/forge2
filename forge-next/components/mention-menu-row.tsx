import { MentionKindIcon } from "@/components/mention-kind-icon";
import type { PromptMentionItem } from "@/lib/prompts/mention-types";

const rowClass =
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold transition hover:bg-glass-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coach/50";

export function MentionMenuRow({
  item,
  index,
  highlightedIndex,
  onHighlight,
  onSelect,
}: {
  item: PromptMentionItem;
  index: number;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (item: PromptMentionItem) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={index === highlightedIndex}
      className={`${rowClass}${
        index === highlightedIndex ? " bg-glass-focus" : ""
      }`}
      onMouseEnter={() => onHighlight(index)}
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(item);
      }}
    >
      <MentionKindIcon kind={item.kind} />
      <span className="truncate text-surface-foreground">{item.label}</span>
    </button>
  );
}
