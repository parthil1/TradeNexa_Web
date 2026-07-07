"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { fetchCategories } from "@/services/catalogService";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";

export default function BuyerCategoriesPage() {
  const fetchPage = useCallback(
    (page: number) =>
      fetchCategories({
        page,
        limit: 16,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      }),
    []
  );

  const { items: categories, loading, loadingMore, hasMore, loadMore } = useLoadMoreList({
    fetchPage,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Categories" subtitle="Browse products by industry" />
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-8 text-center text-sm text-[#546E7A]">
          <LayoutGrid className="mx-auto mb-2 h-8 w-8" />
          No categories available
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = getCategoryFallbackIcon(cat.slug, cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/buyer/category/${cat.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#E8ECF0] bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EFF9]">
                    <Icon className="h-5 w-5 text-[#1565C0]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#0D1B2A]">{cat.name}</p>
                    <p className="text-xs text-[#546E7A]">{cat.product_count ?? 0} products</p>
                  </div>
                </Link>
              );
            })}
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
