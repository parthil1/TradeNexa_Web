"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CTABanner from "@/components/CTABanner";
import CatalogPageHeader from "@/components/catalog/CatalogPageHeader";
import ProductCard from "@/components/catalog/ProductCard";
import CatalogLoadMore from "@/components/catalog/CatalogLoadMore";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { ProductGridSkeleton } from "@/components/catalog/CatalogSkeleton";
import { fetchCategoryBySlug, fetchProducts } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import type { ApiCategoryDetail, ApiSubcategory } from "@/types/catalog";

export default function SubcategoryProductsPage() {
  const params = useParams();
  const categorySlug = String(params.slug ?? "");
  const subSlug = String(params.subSlug ?? "");

  const [category, setCategory] = useState<ApiCategoryDetail | null>(null);
  const [subcategory, setSubcategory] = useState<ApiSubcategory | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        const sub = (detail.subcategories ?? []).find((s) => s.slug === subSlug && s.is_active);
        if (!sub) {
          if (!cancelled) setMetaError("Subcategory not found");
          return;
        }
        if (!cancelled) {
          setCategory(detail);
          setSubcategory(sub);
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

  const fetchPage = useCallback(
    (page: number) => {
      if (!subcategory) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        });
      }
      return fetchProducts({
        subcategory_id: subcategory.id,
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        sort_by: "name",
        sort_order: "asc",
      });
    },
    [subcategory, debouncedSearch]
  );

  const { items: products, pagination, loading, loadingMore, error, loadMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [subcategory?.id, debouncedSearch],
      enabled: !!subcategory,
    });

  const displayError = metaError || error;

  if (displayError && !metaLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
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
    <div className="flex min-h-screen flex-col">
      {metaLoading || !category || !subcategory ? (
        <div className="border-b border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl animate-pulse px-4">
            <div className="h-24 rounded-xl bg-slate-200" />
          </div>
        </div>
      ) : (
        <CatalogPageHeader
          badge={category.name}
          title={subcategory.name}
          subtitle={`${(subcategory.product_count ?? pagination.total).toLocaleString()} product listings from verified sellers`}
          breadcrumbs={[
            { label: "Categories", href: "/categories" },
            { label: category.name, href: `/categories/${category.slug}` },
            { label: subcategory.name },
          ]}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: `Search in ${subcategory.name}...`,
            resultCount: pagination.total,
            loading: loading && !loadingMore,
          }}
        />
      )}

      <section className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} delay={Math.min(i * 0.03, 0.3)} />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-6">
                  <ProductGridSkeleton count={4} />
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
          ) : subcategory ? (
            <CatalogEmptyState
              title="No products found"
              description="Try a different search term or browse other subcategories."
              onReset={() => setSearch("")}
              resetLabel="Clear search"
            />
          ) : null}

          {category && subcategory && (
            <div className="mt-10 text-center">
              <Link
                href={`/categories/${category.slug}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                ← Back to {category.name}
              </Link>
            </div>
          )}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
