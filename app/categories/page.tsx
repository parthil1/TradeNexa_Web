"use client";

import React, { useCallback, useMemo, useState } from "react";
import MarketplaceCategoryRow from "@/components/catalog/marketplace/MarketplaceCategoryRow";
import MarketplaceSearchBar from "@/components/catalog/marketplace/MarketplaceSearchBar";
import CTABanner from "@/components/CTABanner";
import CatalogLoadMore from "@/components/catalog/CatalogLoadMore";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import CatalogBreadcrumbs from "@/components/catalog/CatalogBreadcrumbs";
import {
  MARKETPLACE_CONTAINER,
  MarketplaceCategoryGridSkeleton,
} from "@/components/catalog/marketplace/marketplaceLayout";
import { fetchCategories } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { MARKETPLACE_NAVY } from "@/utils/marketplaceTheme";

export default function CategoriesPage() {
  const [filterQuery, setFilterQuery] = useState("");
  const debouncedSearch = useDebouncedValue(filterQuery);

  const fetchPage = useCallback(
    (page: number) =>
      fetchCategories({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      }),
    [debouncedSearch]
  );

  const { items: categories, pagination, loading, loadingMore, error, loadMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [debouncedSearch],
    });

  const totalProducts = useMemo(
    () => categories.reduce((sum, cat) => sum + (cat.product_count ?? 0), 0),
    [categories]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <section className={`relative bg-gradient-to-br ${MARKETPLACE_NAVY} pb-8 pt-8 lg:pb-12 lg:pt-10`}>
        <div className={`${MARKETPLACE_CONTAINER} relative`}>
          <div className="hidden lg:block">
            <CatalogBreadcrumbs items={[{ label: "Categories" }]} variant="light" />
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200/90">
                Global Supply Marketplace
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Browse Categories
              </h1>
              <p className="mt-3 hidden text-base text-blue-100/90 lg:block">
                Explore industries, open subcategories, and discover verified B2B products from
                sellers across India.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[420px] lg:shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm lg:py-5">
                <p className="text-xs font-medium text-blue-100/80">Industries</p>
                <p className="mt-1 text-3xl font-extrabold text-white lg:text-4xl">
                  {loading && categories.length === 0 ? "—" : pagination.total}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm lg:py-5">
                <p className="text-xs font-medium text-blue-100/80">Total Products</p>
                <p className="mt-1 text-3xl font-extrabold text-white lg:text-4xl">
                  {loading && categories.length === 0 ? "—" : totalProducts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-10 lg:max-w-xl">
            <MarketplaceSearchBar
              value={filterQuery}
              onChange={setFilterQuery}
              placeholder={`Search across ${pagination.total || "all"} categories...`}
            />
          </div>
        </div>
      </section>

      <section className={`${MARKETPLACE_CONTAINER} flex-1 py-8 lg:py-12`}>
        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">{categories.length}</span> of{" "}
              <span className="font-semibold text-slate-800">{pagination.total}</span> categories
            </p>
          </div>
        )}

        {loading && categories.length === 0 ? (
          <MarketplaceCategoryGridSkeleton count={9} />
        ) : categories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((cat, idx) => (
                <MarketplaceCategoryRow
                  key={cat.id}
                  slug={cat.slug}
                  imageUrl={cat.icon || cat.image}
                  title={cat.name}
                  productCount={cat.product_count ?? 0}
                  subcategoryCount={cat.subcategory_count ?? 0}
                  href={`/categories/${cat.slug}`}
                  index={idx}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="mt-6">
                <MarketplaceCategoryGridSkeleton count={3} />
              </div>
            )}

            <CatalogLoadMore
              pagination={pagination}
              loading={loading}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
              autoLoad
              itemLabel="categories"
            />
          </>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm">
            <CatalogEmptyState
              title="No categories match your search"
              description="Try a different keyword or clear the search to browse all categories."
              onReset={() => setFilterQuery("")}
              resetLabel="Clear search"
            />
          </div>
        )}
      </section>

      <CTABanner />
    </div>
  );
}
