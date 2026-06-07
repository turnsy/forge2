"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui";

export function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore && !loading) {
    return null;
  }

  return (
    <div
      ref={sentinelRef}
      className="flex justify-center py-3"
      aria-hidden={!loading}
    >
      {loading ? <Spinner /> : null}
    </div>
  );
}
