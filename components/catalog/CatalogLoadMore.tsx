"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { ApiPagination } from "@/types/catalog";

interface CatalogLoadMoreProps {
  pagination: ApiPagination;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
  autoLoad?: boolean;
  itemLabel?: string;
}

export default function CatalogLoadMore({
  pagination,
  loading = false,
  loadingMore = false,
  onLoadMore,
  autoLoad = false,
  itemLabel = "items",
}: CatalogLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { totalPages, page } = pagination;
  const hasMore = page < totalPages;

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) onLoadMore();
  }, [loading, loadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    if (!autoLoad || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [autoLoad, hasMore, handleLoadMore]);

  if (!hasMore) return null;

  return (
    <div className="mt-10">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loading || loadingMore}
          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingMore ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            `Load more ${itemLabel}`
          )}
        </button>
      </div>
      {autoLoad && <div ref={sentinelRef} className="h-1" aria-hidden />}
    </div>
  );
}
