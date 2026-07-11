"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import MarketplaceDetailHeader from "@/components/catalog/marketplace/MarketplaceDetailHeader";
import CategoryProductsLayout from "@/components/catalog/marketplace/CategoryProductsLayout";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import {
  fetchCategoryBySlug,
  fetchProducts,
  fetchSubcategories,
  findSubcategoryBySlug,
} from "@/services/catalogService";
import { useCityFilter } from "@/hooks/useCityFilter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import type { ApiCategoryDetail, ApiSubcategory } from "@/types/catalog";

export default function SubcategoryProductsPage() {
  const params = useParams();
  const categorySlug = String(params.slug ?? "");
  const subSlug = String(params.subSlug ?? "");

  const [category, setCategory] = useState<ApiCategoryDetail | null>(null);
  const [resolvedSub, setResolvedSub] = useState<ApiSubcategory | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    stateId,
    cityId,
    setCityId,
    handleStateChange,
    clearLocationFilters,
    hasLocationFilter,
    cityFilterParams,
  } = useCityFilter();

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const detail = await fetchCategoryBySlug(categorySlug);
        if (!detail) {
          if (!cancelled) setMetaError("Category not found");
          return;
        }
        const sub = await findSubcategoryBySlug(detail.id, subSlug);
        if (!sub) {
          if (!cancelled) setMetaError("Subcategory not found");
          return;
        }
        if (!cancelled) {
          setCategory(detail);
          setResolvedSub(sub);
          setSelectedSubId(sub.id);
        }
      } catch (err) {
        if (!cancelled) {
          setMetaError(err instanceof Error ? err.message : "Failed to load subcategory");
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }

    if (categorySlug && subSlug) void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, subSlug]);

  const fetchSubPage = useCallback(
    (page: number) => {
      if (!category) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        });
      }
      return fetchSubcategories(category.id, {
        page,
        limit: 20,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      });
    },
    [category]
  );

  const {
    items: loadedSubs,
    pagination: subPagination,
    loading: loadingSubs,
    loadingMore: loadingMoreSubs,
    loadMore: loadMoreSubs,
    error: subError,
  } = useLoadMoreList({
    fetchPage: fetchSubPage,
    resetDeps: [category?.id],
    enabled: !!category,
  });

  const subcategories = useMemo(() => {
    if (!resolvedSub) return loadedSubs;
    if (loadedSubs.some((s) => s.id === resolvedSub.id)) return loadedSubs;
    return [resolvedSub, ...loadedSubs];
  }, [loadedSubs, resolvedSub]);

  const activeSub = useMemo(() => {
    if (selectedSubId === null) return null;
    return (
      subcategories.find((s) => s.id === selectedSubId) ??
      (resolvedSub?.id === selectedSubId ? resolvedSub : null)
    );
  }, [subcategories, selectedSubId, resolvedSub]);

  const fetchProductPage = useCallback(
    (page: number) => {
      if (!category && !resolvedSub) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        });
      }
      if (selectedSubId === null && category) {
        return fetchProducts({
          category_id: category.id,
          page,
          limit: 12,
          search: debouncedSearch || undefined,
          sort_by: "name",
          sort_order: "asc",
          ...cityFilterParams,
        });
      }
      const subId = selectedSubId ?? resolvedSub?.id;
      if (!subId) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        });
      }
      return fetchProducts({
        subcategory_id: subId,
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        sort_by: "name",
        sort_order: "asc",
        ...cityFilterParams,
      });
    },
    [selectedSubId, resolvedSub?.id, category, debouncedSearch, cityFilterParams]
  );

  const {
    items: products,
    pagination,
    loading: loadingProducts,
    loadingMore: loadingMoreProducts,
    loadMore: loadMoreProducts,
    error: productError,
  } = useLoadMoreList({
    fetchPage: fetchProductPage,
    resetDeps: [selectedSubId, category?.id, resolvedSub?.id, debouncedSearch, cityId],
    enabled: !!category || !!resolvedSub,
  });

  function clearFilters() {
    setSearch("");
    clearLocationFilters();
  }

  const displayError = metaError || productError || subError;
  const headerTitle = category?.name ?? "Category";
  const productCountLabel = metaLoading
    ? "Loading..."
    : `${(activeSub?.product_count ?? pagination.total).toLocaleString()} products available`;

  const totalSubcategoryCount = subPagination.total || category?.subcategory_count || 0;

  if (displayError && !metaLoading && metaError) {
    return (
      <div className={`${MARKETPLACE_CONTAINER} py-20`}>
        <CatalogEmptyState
          title="Not found"
          description={displayError}
          onReset={() => window.location.assign("/categories")}
          resetLabel="Back to categories"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketplaceDetailHeader
        title={headerTitle}
        backHref={`/categories/${categorySlug}`}
        backLabel={category?.name ?? "Category"}
        iconSrc={category?.icon || category?.image}
        slug={category?.slug ?? categorySlug}
        subtitle={productCountLabel}
        breadcrumbs={[
          { label: "Categories", href: "/categories" },
          { label: category?.name ?? "Category", href: `/categories/${categorySlug}` },
          { label: activeSub?.name ?? resolvedSub?.name ?? "Subcategory" },
        ]}
        subcategoryCount={totalSubcategoryCount}
        productCount={category?.product_count}
        loading={metaLoading}
      />

      {displayError && !metaError && (
        <div className={`${MARKETPLACE_CONTAINER} pt-4`}>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {displayError}
          </div>
        </div>
      )}

      {category && (
        <CategoryProductsLayout
          subcategories={subcategories}
          selectedSubId={selectedSubId}
          onSelectSub={setSelectedSubId}
          totalProductCount={category.product_count}
          subPagination={subPagination}
          loadingSubs={loadingSubs}
          loadingMoreSubs={loadingMoreSubs}
          onLoadMoreSubs={loadMoreSubs}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={`Search within ${activeSub?.name ?? category.name}...`}
          stateId={stateId}
          cityId={cityId}
          onStateChange={handleStateChange}
          onCityChange={setCityId}
          onClearFilters={clearFilters}
          clearFiltersDisabled={!search.trim() && !hasLocationFilter}
          products={products}
          subcategoryLabel={selectedSubId === null ? undefined : activeSub?.name}
          pagination={pagination}
          loading={metaLoading || loadingProducts}
          loadingMore={loadingMoreProducts}
          onLoadMore={loadMoreProducts}
          resultsLabel={`${pagination.total.toLocaleString()} products`}
          onEmptyReset={clearFilters}
          emptyResetLabel="Clear filters"
        />
      )}

      <CTABanner />
    </div>
  );
}
