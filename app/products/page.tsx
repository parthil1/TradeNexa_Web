"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import CatalogPageHeader from "@/components/catalog/CatalogPageHeader";
import ProductCard from "@/components/catalog/ProductCard";
import CatalogLoadMore from "@/components/catalog/CatalogLoadMore";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { ProductGridSkeleton } from "@/components/catalog/CatalogSkeleton";
import {
  fetchProducts,
  fetchCategoryById,
  findSubcategoryById,
} from "@/services/catalogService";
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
      fetchProducts({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        subcategory_id: subcategoryId ? Number(subcategoryId) : undefined,
        is_trending: trendingOnly ? true : undefined,
        sort_by: trendingOnly ? "created_at" : "name",
        sort_order: trendingOnly ? "desc" : "asc",
      }),
    [debouncedSearch, categoryId, subcategoryId, trendingOnly]
  );

  const { items: products, pagination, loading, loadingMore, error, loadMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [debouncedSearch, categoryId, subcategoryId, trendingOnly],
      enabled: !redirecting,
    });

  const pageTitle = trendingOnly ? "Trending Products" : "All Products";

  const breadcrumbs = trendingOnly
    ? [
        { label: "Categories", href: "/categories" },
        { label: "Products", href: "/products" },
        { label: pageTitle },
      ]
    : [
        { label: "Categories", href: "/categories" },
        { label: pageTitle },
      ];

  if (redirecting) {
    return (
      <div className="flex min-h-[50vh] flex-col">
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CatalogPageHeader
        badge="Marketplace"
        title={pageTitle}
        subtitle="Discover verified B2B listings from sellers across India."
        breadcrumbs={breadcrumbs}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search products by name...",
          resultCount: pagination.total,
          loading: loading && !loadingMore,
        }}
      />

      <section className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading && products.length === 0 ? (
            <ProductGridSkeleton count={12} />
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
          ) : (
            <CatalogEmptyState
              title="No products found"
              description="Try adjusting your search or browse categories."
              onReset={() => setSearch("")}
              resetLabel="Clear search"
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
    <Suspense fallback={<ProductGridSkeleton count={8} />}>
      <ProductsPageContent />
    </Suspense>
  );
}
