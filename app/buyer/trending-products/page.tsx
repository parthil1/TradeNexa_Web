"use client";

import React, { useCallback } from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { fetchProducts } from "@/services/catalogService";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { Loader2 } from "lucide-react";

export default function BuyerTrendingPage() {
  const fetchPage = useCallback(
    (page: number) =>
      fetchProducts({
        page,
        limit: 12,
        is_trending: true,
        sort_by: "created_at",
        sort_order: "desc",
      }),
    []
  );

  const { items: products, loading, loadingMore, hasMore, loadMore } = useLoadMoreList({
    fetchPage,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Trending Products" subtitle="Most popular B2B listings this week" />
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Loading...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <PortalProductCard key={p.id} product={p} />
            ))}
          </div>
          <PortalInfiniteScroll
            hasMore={hasMore}
            loading={loading}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </>
      )}
    </div>
  );
}
