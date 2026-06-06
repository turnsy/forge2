"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { MentionMenuRow } from "@/components/prompt/mention-menu-row";
import { Separator, Spinner } from "@/components/ui";
import type { MentionSearchGroups } from "@/lib/prompts/mentions/search";
import type { PromptMentionItem } from "@/lib/prompts/mentions/types";

export function MentionMenu({
  groups,
  highlightedIndex,
  anchor,
  open,
  loading = false,
  onHighlight,
  onSelect,
  menuId,
}: {
  groups: MentionSearchGroups;
  highlightedIndex: number;
  anchor: { top: number; left: number } | null;
  open: boolean;
  loading?: boolean;
  onHighlight: (index: number) => void;
  onSelect: (item: PromptMentionItem) => void;
  menuId: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const hasResults = groups.athletes.length > 0 || groups.plans.length > 0;
  const athleteRows = groups.athletes.map((item, index) => ({ item, index }));
  const planRows = groups.plans.map((item, index) => ({
    item,
    index: groups.athletes.length + index,
  }));

  if (!open || !anchor || !mounted) {
    return null;
  }

  return createPortal(
    <div
      id={menuId}
      role="listbox"
      aria-label="Mention suggestions"
      aria-busy={loading}
      className="fixed z-50 min-w-56 overflow-hidden rounded-xl border border-glass-border bg-surface p-1 shadow-lg glass-surface"
      style={{ top: anchor.top, left: anchor.left }}
      data-mention-menu
    >
      {loading ? (
        <div className="flex items-center justify-center px-2 py-3">
          <Spinner className="h-5 w-5" label="Loading suggestions" />
        </div>
      ) : !hasResults ? (
        <div className="px-2 py-2 text-sm font-semibold text-surface-muted">
          No results
        </div>
      ) : (
        <>
          {athleteRows.map(({ item, index }) => (
            <MentionMenuRow
              key={`${item.kind}-${item.id}`}
              item={item}
              index={index}
              highlightedIndex={highlightedIndex}
              onHighlight={onHighlight}
              onSelect={onSelect}
            />
          ))}
          {groups.athletes.length > 0 && groups.plans.length > 0 ? (
            <Separator />
          ) : null}
          {planRows.map(({ item, index }) => (
            <MentionMenuRow
              key={`${item.kind}-${item.id}`}
              item={item}
              index={index}
              highlightedIndex={highlightedIndex}
              onHighlight={onHighlight}
              onSelect={onSelect}
            />
          ))}
        </>
      )}
    </div>,
    document.body,
  );
}
