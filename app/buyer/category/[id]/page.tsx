"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalSubcategoryPills from "@/components/portal/PortalSubcategoryPills";
import PortalSearchBar from "@/components/portal/PortalSearchBar";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalProductGrid from "@/components/portal/PortalProductGrid";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { fetchCategoryById, fetchProducts, fetchSubcategories } from "@/services/catalogService";
import { useCityFilter } from "@/hooks/useCityFilter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";
import { resolveImageUrl } from "@/utils/catalogHelpers";
import type { ApiCategoryDetail } from "@/types/catalog";
import LocationFilterBar from "@/components/location/LocationFilterBar";

export default function BuyerCategoryPage() {
  const params = useParams();
  const categoryId = Number(params.id);

  return <BuyerCategoryContent key={categoryId} categoryId={categoryId} />;
}

function BuyerCategoryContent({ categoryId }: { categoryId: number }) {
  const [category, setCategory] = useState<ApiCategoryDetail | null>(null);
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
    if (!categoryId) return;
    let cancelled = false;

    async function loadCategory() {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const detail = await fetchCategoryById(categoryId);
        if (!detail) {
          if (!cancelled) setMetaError("Category not found");
          return;
        }
        if (!cancelled) setCategory(detail);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : err && typeof err === "object" && "message" in err
                ? String((err as { message: string }).message)
                : "Failed to load category";
          setMetaError(message);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }

    void loadCategory();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const fetchSubPage = useCallback(
    (page: number) => {
      if (!categoryId) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        });
      }
      return fetchSubcategories(categoryId, {
        page,
        limit: 20,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      });
    },
    [categoryId]
  );

  const {
    items: subcategories,
    pagination: subPagination,
    loading: loadingSubs,
    loadingMore: loadingMoreSubs,
    loadMore: loadMoreSubs,
  } = useLoadMoreList({
    fetchPage: fetchSubPage,
    resetDeps: [categoryId],
    enabled: !!categoryId,
  });

  const selectedSub = useMemo(
    () => subcategories.find((s) => s.id === selectedSubId) ?? null,
    [subcategories, selectedSubId]
  );

  const fetchProductPage = useCallback(
    (page: number) => {
      if (!categoryId) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        });
      }
      return fetchProducts({
        category_id: categoryId,
        subcategory_id: selectedSubId ?? undefined,
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        sort_by: "name",
        sort_order: "asc",
        ...cityFilterParams,
      });
    },
    [categoryId, selectedSubId, debouncedSearch, cityFilterParams]
  );

  const {
    items: products,
    pagination,
    loading: loadingProducts,
    loadingMore: loadingMoreProducts,
    loadMore: loadMoreProducts,
    error: productError,
    hasMore: hasMoreProducts,
  } = useLoadMoreList({
    fetchPage: fetchProductPage,
    resetDeps: [categoryId, selectedSubId, debouncedSearch, cityId],
    enabled: !!categoryId,
  });

  function clearFilters() {
    setSearch("");
    clearLocationFilters();
  }

  const productCountLabel =
    selectedSubId === null
      ? `${pagination.total.toLocaleString()} products`
      : `${(selectedSub?.product_count ?? pagination.total).toLocaleString()} products`;

  const FallbackIcon = getCategoryFallbackIcon(category?.slug, category?.name);
  const logoUrl = resolveImageUrl(category?.icon || category?.image);

  if (metaError && !metaLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PortalBackLink href="/buyer/categories" label="All Categories" />
        <PortalEmptyState icon={Search} title="Category not found" description={metaError} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/categories" label="All Categories" />

      {metaLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading category...
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft sm:h-14 sm:w-14">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={category?.name ?? "Category"}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <FallbackIcon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-foreground sm:text-2xl">
                {category?.name}
              </h2>
              <p className="mt-0.5 text-sm text-muted-fg">{productCountLabel}</p>
            </div>
          </div>

          <PortalSubcategoryPills
            subcategories={subcategories}
            selectedSubId={selectedSubId}
            onSelect={setSelectedSubId}
            totalProductCount={category?.product_count}
            subPagination={subPagination}
            loadingSubs={loadingSubs}
            loadingMoreSubs={loadingMoreSubs}
            onLoadMoreSubs={loadMoreSubs}
          />

          <PortalSearchBar
            value={search}
            onChange={setSearch}
            placeholder={`Search in ${selectedSub?.name ?? category?.name ?? "category"}...`}
            className="mt-4"
          />

          <LocationFilterBar
            idPrefix="buyer-category"
            stateId={stateId}
            cityId={cityId}
            onStateChange={handleStateChange}
            onCityChange={setCityId}
            onClear={clearFilters}
            clearDisabled={!search.trim() && !hasLocationFilter}
            className="mt-3"
          />

          {productError ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {productError}
            </p>
          ) : null}

          {!loadingProducts && products.length > 0 ? (
            <p className="mt-4 text-sm text-muted-fg">
              Showing <span className="font-semibold text-foreground">{products.length}</span>
              {pagination.total > products.length ? (
                <>
                  {" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {pagination.total.toLocaleString()}
                  </span>
                </>
              ) : null}{" "}
              products
              {selectedSub ? (
                <>
                  {" "}
                  in <span className="font-semibold text-primary">{selectedSub.name}</span>
                </>
              ) : null}
            </p>
          ) : null}

          {loadingProducts ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="mt-6">
              <PortalEmptyState
                icon={Search}
                title="No products found"
                description={
                  selectedSubId
                    ? `No products in "${selectedSub?.name}". Try All or another subcategory.`
                    : "No products in this category yet."
                }
              />
            </div>
          ) : (
            <>
              <PortalProductGrid className="mt-4">
                {products.map((p) => (
                  <PortalProductCard
                    key={p.id}
                    product={p}
                    subcategoryLabel={selectedSub?.name}
                  />
                ))}
              </PortalProductGrid>
              <PortalInfiniteScroll
                hasMore={hasMoreProducts}
                loading={loadingProducts}
                loadingMore={loadingMoreProducts}
                onLoadMore={loadMoreProducts}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
