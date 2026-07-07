"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { fetchProducts } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";

export default function BuyerSearchPage() {
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 400);

  const fetchPage = useCallback(
    (page: number) =>
      fetchProducts({
        page,
        limit: 12,
        search: debounced || undefined,
        sort_by: "name",
        sort_order: "asc",
      }),
    [debounced]
  );

  const { items: products, loading, loadingMore, error, hasMore, loadMore } = useLoadMoreList({
    fetchPage,
    resetDeps: [debounced],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Search Products" subtitle="Find suppliers and products across India" />
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#546E7A]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product, category, or supplier..."
          className="w-full rounded-2xl border border-[#E0E6ED] bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20"
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Searching...
        </div>
      ) : products.length === 0 ? (
        <PortalEmptyState
          icon={Search}
          title="No products found"
          description="Try a different search term or browse categories."
          action={
            <Link href="/buyer/categories" className="rounded-xl bg-[#1565C0] px-4 py-2 text-sm font-bold text-white">
              Browse Categories
            </Link>
          }
        />
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
