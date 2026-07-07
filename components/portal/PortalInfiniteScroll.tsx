"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PortalInfiniteScrollProps {
  hasMore: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
}

export default function PortalInfiniteScroll({
  hasMore,
  loading = false,
  loadingMore = false,
  onLoadMore,
}: PortalInfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) onLoadMore();
  }, [loading, loadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { rootMargin: "240px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  if (!hasMore) return null;

  return (
    <div className="mt-6 flex flex-col items-center gap-2 py-4">
      {loadingMore ? (
        <div className="flex items-center gap-2 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Loading more...
        </div>
      ) : null}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
    </div>
  );
}
