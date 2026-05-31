import type { PromptMentionItem } from "@/lib/prompts/mention-types";

const rowClass =
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-glass-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coach/50";

function MentionKindIcon({ kind }: { kind: PromptMentionItem["kind"] }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-glass-border bg-glass text-xs font-semibold text-surface-muted"
    >
      {kind === "athlete" ? "A" : "P"}
    </span>
  );
}

export function MentionMenu({
  items,
  highlightedIndex,
  anchor,
  open,
  onHighlight,
  onSelect,
  menuId,
}: {
  items: PromptMentionItem[];
  highlightedIndex: number;
  anchor: { top: number; left: number } | null;
  open: boolean;
  onHighlight: (index: number) => void;
  onSelect: (item: PromptMentionItem) => void;
  menuId: string;
}) {
  if (!open || !anchor) {
    return null;
  }

  return (
    <div
      id={menuId}
      role="listbox"
      aria-label="Mention suggestions"
      className="fixed z-50 min-w-56 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface"
      style={{ top: anchor.top, left: anchor.left }}
    >
      {items.length === 0 ? (
        <div className="px-2 py-2 text-sm text-surface-muted">No results</div>
      ) : (
        items.map((item, index) => (
          <button
            key={`${item.kind}-${item.id}`}
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
            <span className="truncate font-medium text-surface-foreground">
              {item.label}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
