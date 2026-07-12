import type { ReactNode } from "react";
import { InfiniteScrollSentinel } from "@/components/list/infinite-scroll-sentinel";
import { ModalListLoading } from "@/components/list/modal-list-loading";
import { Message } from "@/components/ui";

export function AssignmentModalListPanel({
  isListLoading,
  error,
  isEmpty,
  emptyMessage,
  hasMore,
  isLoadingMore,
  onLoadMore,
  children,
}: {
  isListLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-glass-border bg-glass shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md">
      {isListLoading ? (
        <ModalListLoading />
      ) : error ? (
        <div className="p-4">
          <Message tone="error">{error}</Message>
        </div>
      ) : isEmpty ? (
        <p className="p-4 text-sm text-surface-muted">{emptyMessage}</p>
      ) : (
        children
      )}

      <InfiniteScrollSentinel
        hasMore={hasMore}
        loading={isLoadingMore}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}
