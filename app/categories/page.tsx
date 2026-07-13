"use client";

import React, { useCallback, useMemo, useState } from "react";
import MarketplaceCategoryRow from "@/components/catalog/marketplace/MarketplaceCategoryRow";
import MarketplaceSearchBar from "@/components/catalog/marketplace/MarketplaceSearchBar";
import CTABanner from "@/components/CTABanner";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import CatalogBreadcrumbs from "@/components/catalog/CatalogBreadcrumbs";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import {
  MARKETPLACE_CONTAINER,
  MarketplaceCategoryGridSkeleton,
} from "@/components/catalog/marketplace/marketplaceLayout";
import { fetchCategories } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";

export default function CategoriesPage() {
  const [filterQuery, setFilterQuery] = useState("");
  const debouncedSearch = useDebouncedValue(filterQuery);

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

  const { items: categories, pagination, loading, loadingMore, error, loadMore, hasMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [debouncedSearch],
    });

  const totalProducts = useMemo(
    () => categories.reduce((sum, cat) => sum + (cat.product_count ?? 0), 0),
    [categories]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden bg-navy pb-10 pt-8 lg:pb-12 lg:pt-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgb(21_101_192/0.3),transparent)]" />
        <div className={`${MARKETPLACE_CONTAINER} relative`}>
          <div className="mb-6 hidden lg:mb-8 lg:block">
            <CatalogBreadcrumbs items={[{ label: "Categories" }]} variant="light" />
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Global Supply Marketplace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Browse Categories
              </h1>
              <p className="mt-3 hidden text-base text-white/70 lg:block">
                Explore industries, open subcategories, and discover verified B2B products from
                sellers across India.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[420px] lg:shrink-0">
              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm lg:py-5">
                <p className="text-xs font-medium text-white/55">Industries</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  {loading && categories.length === 0 ? "—" : pagination.total}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm lg:py-5">
                <p className="text-xs font-medium text-white/55">Total Products</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  {loading && categories.length === 0 ? "—" : totalProducts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-md lg:mt-8">
            <MarketplaceSearchBar
              size="sm"
              value={filterQuery}
              onChange={setFilterQuery}
              placeholder={`Search across ${pagination.total || "all"} categories...`}
            />
          </div>
        </div>
      </section>

      <section className={`${MARKETPLACE_CONTAINER} flex-1 py-8 lg:py-12`}>
        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-fg">
              Showing{" "}
              <span className="font-semibold text-navy">{categories.length}</span> of{" "}
              <span className="font-semibold text-navy">{pagination.total}</span> categories
            </p>
          </div>
        )}

        {loading && categories.length === 0 ? (
          <MarketplaceCategoryGridSkeleton count={9} />
        ) : categories.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

            <PortalInfiniteScroll
              hasMore={hasMore}
              loading={loading}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          </>
        ) : (
          <div className="rounded-2xl bg-card shadow-card">
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
