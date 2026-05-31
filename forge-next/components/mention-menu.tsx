"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { MentionKindIcon } from "@/components/mention-kind-icon";
import type { MentionSearchGroups } from "@/lib/prompts/mention-search";

const rowClass =
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold transition hover:bg-glass-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coach/50";

function MentionMenuRow({
  item,
  index,
  highlightedIndex,
  onHighlight,
  onSelect,
}: {
  item: MentionSearchGroups["athletes"][number];
  index: number;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (item: MentionSearchGroups["athletes"][number]) => void;
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

export function MentionMenu({
  groups,
  highlightedIndex,
  anchor,
  open,
  onHighlight,
  onSelect,
  menuId,
}: {
  groups: MentionSearchGroups;
  highlightedIndex: number;
  anchor: { top: number; left: number } | null;
  open: boolean;
  onHighlight: (index: number) => void;
  onSelect: (item: MentionSearchGroups["athletes"][number]) => void;
  menuId: string;
}) {
  const [mounted, setMounted] = useState(false);
  const hasResults = groups.athletes.length > 0 || groups.plans.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !anchor || !mounted) {
    return null;
  }

  let optionIndex = 0;

  return createPortal(
    <div
      id={menuId}
      role="listbox"
      aria-label="Mention suggestions"
      className="fixed z-50 min-w-56 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface"
      style={{ top: anchor.top, left: anchor.left }}
      data-mention-menu
    >
      {!hasResults ? (
        <div className="px-2 py-2 text-sm font-semibold text-surface-muted">
          No results
        </div>
      ) : (
        <>
          {groups.athletes.map((item) => {
            const index = optionIndex;
            optionIndex += 1;

            return (
              <MentionMenuRow
                key={`${item.kind}-${item.id}`}
                item={item}
                index={index}
                highlightedIndex={highlightedIndex}
                onHighlight={onHighlight}
                onSelect={onSelect}
              />
            );
          })}
          {groups.athletes.length > 0 && groups.plans.length > 0 ? (
            <div
              className="my-1 border-t border-glass-border"
              role="separator"
              aria-hidden="true"
            />
          ) : null}
          {groups.plans.map((item) => {
            const index = optionIndex;
            optionIndex += 1;

            return (
              <MentionMenuRow
                key={`${item.kind}-${item.id}`}
                item={item}
                index={index}
                highlightedIndex={highlightedIndex}
                onHighlight={onHighlight}
                onSelect={onSelect}
              />
            );
          })}
        </>
      )}
    </div>,
    document.body,
  );
}
