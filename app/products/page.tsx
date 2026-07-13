"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import CatalogLoadMore from "@/components/catalog/CatalogLoadMore";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import CatalogBreadcrumbs from "@/components/catalog/CatalogBreadcrumbs";
import PortalProductCard from "@/components/portal/PortalProductCard";
import { portalProductGridClass } from "@/components/portal/portalLayout";
import MarketplaceSearchBar from "@/components/catalog/marketplace/MarketplaceSearchBar";
import LocationFilterBar from "@/components/location/LocationFilterBar";
import {
  MARKETPLACE_CONTAINER,
  MarketplaceProductGridSkeleton,
} from "@/components/catalog/marketplace/marketplaceLayout";
import {
  fetchProducts,
  fetchTrendingProducts,
  fetchCategoryById,
  findSubcategoryById,
} from "@/services/catalogService";
import { useCityFilter } from "@/hooks/useCityFilter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category_id");
  const subcategoryId = searchParams.get("subcategory_id");
  const trendingOnly = searchParams.get("trending") === "true";

  const [search, setSearch] = useState("");
  const [redirecting, setRedirecting] = useState(!!(categoryId || subcategoryId) && !trendingOnly);
  const debouncedSearch = useDebouncedValue(search);
  const {
    stateId,
    stateLabel,
    cityId,
    cityLabel,
    setCityId,
    handleStateChange,
    clearLocationFilters,
    clearStateFilter,
    clearCityFilter,
    hasLocationFilter,
    cityFilterParams,
  } = useCityFilter({ syncFromGeo: true });

  useEffect(() => {
    let cancelled = false;

    async function redirectToCatalogRoute() {
      if (trendingOnly) return;

      if (subcategoryId) {
        setRedirecting(true);
        const ctx = await findSubcategoryById(Number(subcategoryId));
        if (cancelled) return;
        if (ctx) {
          router.replace(`/categories/${ctx.category.slug}/${ctx.subcategory.slug}`);
          return;
        }
        setRedirecting(false);
        return;
      }

      if (categoryId) {
        setRedirecting(true);
        const detail = await fetchCategoryById(Number(categoryId));
        if (cancelled) return;
        if (detail) {
          router.replace(`/categories/${detail.slug}`);
          return;
        }
        setRedirecting(false);
      }
    }

    void redirectToCatalogRoute();
    return () => {
      cancelled = true;
    };
  }, [categoryId, subcategoryId, trendingOnly, router]);

  const fetchPage = useCallback(
    (page: number) =>
      trendingOnly
        ? fetchTrendingProducts({
            page,
            limit: 12,
            search: debouncedSearch || undefined,
            sort_by: "name",
            sort_order: "asc",
            ...cityFilterParams,
          })
        : fetchProducts({
            page,
            limit: 12,
            search: debouncedSearch || undefined,
            category_id: categoryId ? Number(categoryId) : undefined,
            subcategory_id: subcategoryId ? Number(subcategoryId) : undefined,
            sort_by: "name",
            sort_order: "asc",
            ...cityFilterParams,
          }),
    [debouncedSearch, categoryId, subcategoryId, trendingOnly, cityFilterParams]
  );

  const { items: products, pagination, loading, loadingMore, error, loadMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [debouncedSearch, categoryId, subcategoryId, trendingOnly, cityId],
      enabled: !redirecting,
    });

  function clearFilters() {
    setSearch("");
    clearLocationFilters();
  }

  const pageTitle = trendingOnly ? "Trending Products" : "All Products";

  const breadcrumbs = trendingOnly
    ? [
        { label: "Categories", href: "/categories" },
        { label: "Products", href: "/products" },
        { label: pageTitle },
      ]
    : [{ label: "Categories", href: "/categories" }, { label: pageTitle }];

  if (redirecting) {
    return (
        <div className="flex min-h-[50vh] flex-col bg-background">
        <div className={MARKETPLACE_CONTAINER}>
          <MarketplaceProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden bg-navy pb-10 pt-8 lg:pb-12 lg:pt-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgb(21_101_192/0.3),transparent)]" />
        <div className={`${MARKETPLACE_CONTAINER} relative space-y-6`}>
          <div className="mb-6 hidden lg:mb-8 lg:block">
            <CatalogBreadcrumbs items={breadcrumbs} variant="light" />
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Marketplace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {pageTitle}
              </h1>
              <p className="mt-3 hidden text-base text-white/70 lg:block">
                Discover verified B2B listings from sellers across India.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[280px] lg:shrink-0">
              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm lg:col-span-2 lg:py-5">
                <p className="text-xs font-medium text-white/55">Products Listed</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
                  {loading && products.length === 0 ? "—" : pagination.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-md lg:mt-8">
            <MarketplaceSearchBar
              size="sm"
              value={search}
              onChange={setSearch}
              placeholder="Search products by name..."
            />
          </div>
        </div>
      </section>

      <section className="flex-1 py-8 lg:py-12">
        <div className={MARKETPLACE_CONTAINER}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LocationFilterBar
              idPrefix="products"
              variant="toolbar"
              stateId={stateId}
              stateLabel={stateLabel}
              cityId={cityId}
              cityLabel={cityLabel}
              onStateChange={handleStateChange}
              onCityChange={setCityId}
              onClear={clearFilters}
              onClearState={clearStateFilter}
              onClearCity={clearCityFilter}
              clearDisabled={!search.trim() && !hasLocationFilter}
              className="min-w-0 flex-1"
            />
            {!loading && products.length > 0 ? (
              <p className="shrink-0 text-sm font-medium text-muted-fg sm:text-right">
                Showing{" "}
                <span className="font-semibold text-navy">{products.length}</span> of{" "}
                <span className="font-semibold text-navy">{pagination.total}</span> products
              </p>
            ) : null}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && products.length === 0 ? (
            <MarketplaceProductGridSkeleton count={12} />
          ) : products.length > 0 ? (
            <>
              <div className={`${portalProductGridClass} gap-4`}>
                {products.map((product) => (
                  <PortalProductCard
                    key={product.id}
                    product={product}
                    href={`/products/${product.id}`}
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-6">
                  <MarketplaceProductGridSkeleton count={4} />
                </div>
              )}

              <CatalogLoadMore
                pagination={pagination}
                loading={loading}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
                autoLoad
                itemLabel="products"
              />
            </>
          ) : (
            <CatalogEmptyState
              title="No products found"
              description="Try adjusting your search or browse categories."
              onReset={clearFilters}
              resetLabel="Clear filters"
            />
          )}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background py-12">
          <div className={MARKETPLACE_CONTAINER}>
            <MarketplaceProductGridSkeleton count={8} />
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
