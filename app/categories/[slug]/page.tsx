"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import MarketplaceDetailHeader from "@/components/catalog/marketplace/MarketplaceDetailHeader";
import CategoryProductsLayout from "@/components/catalog/marketplace/CategoryProductsLayout";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { fetchCategoryBySlug, fetchProducts, fetchSubcategories } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import type { ApiCategoryDetail } from "@/types/catalog";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");

  const [category, setCategory] = useState<ApiCategoryDetail | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const detail = await fetchCategoryBySlug(slug);
        if (!detail) {
          if (!cancelled) setMetaError("Category not found");
          return;
        }
        if (!cancelled) setCategory(detail);
      } catch (err) {
        if (!cancelled) {
          setMetaError(err instanceof Error ? err.message : "Failed to load category");
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }

    if (slug) void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
    items: subcategories,
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

  const selectedSub = useMemo(
    () => subcategories.find((s) => s.id === selectedSubId) ?? null,
    [subcategories, selectedSubId]
  );

  const fetchProductPage = useCallback(
    (page: number) => {
      if (!category) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        });
      }
      return fetchProducts({
        category_id: category.id,
        subcategory_id: selectedSubId ?? undefined,
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        sort_by: "name",
        sort_order: "asc",
      });
    },
    [category, selectedSubId, debouncedSearch]
  );

  const {
    items: products,
    pagination,
    loading: loadingProducts,
    loadingMore: loadingMoreProducts,
    error: productError,
    loadMore: loadMoreProducts,
  } = useLoadMoreList({
    fetchPage: fetchProductPage,
    resetDeps: [category?.id, selectedSubId, debouncedSearch],
    enabled: !!category,
  });

  const productCountLabel = metaLoading
    ? "Loading..."
    : `${(category?.product_count ?? pagination.total).toLocaleString()} products available`;

  const totalSubcategoryCount = subPagination.total || category?.subcategory_count || 0;

  if (metaError) {
    return (
      <div className={`${MARKETPLACE_CONTAINER} py-20`}>
        <CatalogEmptyState
          title="Category not found"
          description={metaError}
          onReset={() => window.location.assign("/categories")}
          resetLabel="Back to categories"
        />
      </div>
    );
  }

  const error = productError || subError;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketplaceDetailHeader
        title={category?.name ?? "Category"}
        backHref="/categories"
        backLabel="All categories"
        iconSrc={category?.icon || category?.image}
        slug={category?.slug ?? slug}
        subtitle={productCountLabel}
        breadcrumbs={[
          { label: "Categories", href: "/categories" },
          { label: category?.name ?? "Category" },
        ]}
        subcategoryCount={totalSubcategoryCount}
        productCount={category?.product_count}
        loading={metaLoading}
      />

      {error && (
        <div className={`${MARKETPLACE_CONTAINER} pt-4`}>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
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
          searchPlaceholder={`Search within ${category.name}...`}
          products={products}
          subcategoryLabel={selectedSub?.name}
          pagination={pagination}
          loading={metaLoading || loadingProducts}
          loadingMore={loadingMoreProducts}
          onLoadMore={loadMoreProducts}
          resultsLabel={`${pagination.total.toLocaleString()} products`}
          emptyDescription={
            selectedSubId
              ? "Try another subcategory or clear your search."
              : "Try a different search term or browse other categories."
          }
          onEmptyReset={() => {
            setSearch("");
            setSelectedSubId(null);
          }}
          emptyResetLabel="Clear filters"
        />
      )}

      <CTABanner />
    </div>
  );
}
