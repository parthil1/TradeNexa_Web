"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalSubcategoryPills from "@/components/portal/PortalSubcategoryPills";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import {
  fetchCategoryBySlug,
  fetchProducts,
  fetchSubcategories,
  findSubcategoryBySlug,
} from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import type { ApiCategoryDetail, ApiSubcategory } from "@/types/catalog";

interface WebsiteCategoryViewProps {
  categorySlug: string;
  initialSubSlug?: string;
}

export default function WebsiteCategoryView({
  categorySlug,
  initialSubSlug,
}: WebsiteCategoryViewProps) {
  const [category, setCategory] = useState<ApiCategoryDetail | null>(null);
  const [resolvedSub, setResolvedSub] = useState<ApiSubcategory | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [subcategoryByProductId, setSubcategoryByProductId] = useState<Record<number, string>>({});
  const debouncedSearch = useDebouncedValue(search);

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

        if (initialSubSlug) {
          const sub = await findSubcategoryBySlug(detail.id, initialSubSlug);
          if (!sub) {
            if (!cancelled) setMetaError("Subcategory not found");
            return;
          }
          if (!cancelled) {
            setCategory(detail);
            setResolvedSub(sub);
            setSelectedSubId(sub.id);
          }
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

    if (categorySlug) void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, initialSubSlug]);

  const categoryId = category?.id;

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
    items: loadedSubs,
    pagination: subPagination,
    loading: loadingSubs,
    loadingMore: loadingMoreSubs,
    loadMore: loadMoreSubs,
  } = useLoadMoreList({
    fetchPage: fetchSubPage,
    resetDeps: [categoryId],
    enabled: !!categoryId,
  });

  const subcategories = useMemo(() => {
    if (!resolvedSub) return loadedSubs;
    if (loadedSubs.some((s) => s.id === resolvedSub.id)) return loadedSubs;
    return [resolvedSub, ...loadedSubs];
  }, [loadedSubs, resolvedSub]);

  const selectedSub = useMemo(
    () => subcategories.find((s) => s.id === selectedSubId) ?? null,
    [subcategories, selectedSubId]
  );

  useEffect(() => {
    if (!categoryId || subcategories.length === 0) return;
    let cancelled = false;

    void Promise.all(
      subcategories.map(async (sub) => {
        const { results } = await fetchProducts({
          category_id: categoryId,
          subcategory_id: sub.id,
          page: 1,
          limit: 100,
        });
        return results.map((p) => [p.id, sub.name] as const);
      })
    ).then((groups) => {
      if (cancelled) return;
      const map: Record<number, string> = {};
      for (const pairs of groups) {
        for (const [id, name] of pairs) map[id] = name;
      }
      setSubcategoryByProductId(map);
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId, subcategories]);

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
      });
    },
    [categoryId, selectedSubId, debouncedSearch]
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
    resetDeps: [categoryId, selectedSubId, debouncedSearch],
    enabled: !!categoryId,
  });

  const productCountLabel =
    selectedSubId === null
      ? `${pagination.total.toLocaleString()} products`
      : `${(selectedSub?.product_count ?? pagination.total).toLocaleString()} products`;

  const backHref = initialSubSlug ? `/categories/${categorySlug}` : "/categories";
  const backLabel = initialSubSlug ? (category?.name ?? "Category") : "All Categories";

  if (metaError && !metaLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PortalBackLink href="/categories" label="All Categories" />
          <PortalEmptyState icon={Search} title="Not found" description={metaError} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalBackLink href={backHref} label={backLabel} />

        {metaLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[#546E7A]">
            <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
            Loading category...
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0D1B2A] sm:text-3xl">
                {initialSubSlug ? selectedSub?.name ?? category?.name : category?.name}
              </h1>
              <p className="mt-1 text-sm text-[#546E7A]">
                {initialSubSlug && category ? (
                  <>
                    <span className="font-semibold text-[#1565C0]">{category.name}</span>
                    <span className="mx-1.5 text-[#B0BEC5]">/</span>
                  </>
                ) : null}
                {productCountLabel}
              </p>
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

            <div className="relative mt-5">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#546E7A]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${selectedSub?.name ?? category?.name ?? "category"}...`}
                className="w-full rounded-2xl border border-[#E0E6ED] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20"
              />
            </div>

            {productError ? (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                {productError}
              </p>
            ) : null}

            {loadingProducts ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
                <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
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
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <PortalProductCard
                      key={p.id}
                      product={p}
                      href={`/products/${p.id}`}
                      subcategoryLabel={selectedSub?.name ?? subcategoryByProductId[p.id]}
                    />
                  ))}
                </div>
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
    </div>
  );
}
