"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, Search } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalSearchBar from "@/components/portal/PortalSearchBar";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { fetchCategories } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";

export default function BuyerCategoriesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const fetchPage = useCallback(
    (page: number) =>
      fetchCategories({
        page,
        limit: 16,
        search: debouncedSearch || undefined,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      }),
    [debouncedSearch]
  );

  const {
    items: categories,
    pagination,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
  } = useLoadMoreList({
    fetchPage,
    resetDeps: [debouncedSearch],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Categories" subtitle="Browse products by industry" />

      <PortalSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search categories..."
        className="mb-4"
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>
      ) : null}

      {!loading && categories.length > 0 ? (
        <p className="mb-4 text-sm text-muted-fg">
          Showing <span className="font-semibold text-foreground">{categories.length}</span>
          {pagination.total > categories.length ? (
            <>
              {" "}
              of <span className="font-semibold text-foreground">{pagination.total}</span>
            </>
          ) : null}{" "}
          categories
          {debouncedSearch ? (
            <>
              {" "}
              for &ldquo;<span className="font-semibold text-primary">{debouncedSearch}</span>&rdquo;
            </>
          ) : null}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <PortalEmptyState
          icon={search.trim() ? Search : LayoutGrid}
          title={search.trim() ? "No categories found" : "No categories available"}
          description={
            search.trim()
              ? "Try a different search term or clear the search."
              : "Categories will appear here when available."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = getCategoryFallbackIcon(cat.slug, cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/buyer/category/${cat.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:cursor-pointer hover:border-muted-fg hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-fg">{cat.product_count ?? 0} products</p>
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
