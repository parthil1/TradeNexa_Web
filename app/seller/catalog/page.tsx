"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { fetchProducts } from "@/services/catalogService";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";

export default function SellerCatalogPage() {
  const fetchPage = useCallback(
    (page: number) =>
      fetchProducts({
        page,
        limit: 12,
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
      <PortalPageHeader
        title="My Catalog"
        subtitle="Manage your product listings"
        action={
          <Link href="/seller/add-product" className="inline-flex items-center gap-1.5 rounded-xl bg-[#1565C0] px-4 py-2 text-sm font-bold text-white">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        }
      />
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Loading catalog...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <PortalProductCard key={p.id} product={p} href={`/buyer/product/${p.id}?from=seller-catalog`} />
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
