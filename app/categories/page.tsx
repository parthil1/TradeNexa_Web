"use client";

import React, { useCallback, useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import CTABanner from "@/components/CTABanner";
import CatalogPageHeader from "@/components/catalog/CatalogPageHeader";
import CatalogLoadMore from "@/components/catalog/CatalogLoadMore";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { CatalogGridSkeleton } from "@/components/catalog/CatalogSkeleton";
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

  return (
    <div className="flex min-h-screen flex-col">
      <CatalogPageHeader
        badge="Directory"
        title="Explore B2B Categories"
        subtitle="Browse categories, open subcategories, and discover verified products from sellers across India."
        breadcrumbs={[{ label: "Categories" }]}
        search={{
          value: filterQuery,
          onChange: setFilterQuery,
          placeholder: "Search categories (e.g. Solar, Chemicals...)",
          resultCount: pagination.total,
          loading: loading && !loadingMore,
        }}
      />

      <section className="flex-1 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {loading && categories.length === 0 ? (
            <CatalogGridSkeleton count={12} />
          ) : categories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((cat, idx) => (
                  <CategoryCard
                    key={cat.id}
                    slug={cat.slug}
                    imageUrl={cat.icon || cat.image}
                    title={cat.name}
                    productCount={cat.product_count ?? 0}
                    subcategoryCount={cat.subcategory_count}
                    href={`/categories/${cat.slug}`}
                    delay={Math.min(idx * 0.03, 0.3)}
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-6">
                  <CatalogGridSkeleton count={4} />
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
            <CatalogEmptyState
              title="No categories match your search"
              description="Try a different keyword or clear the search to browse all categories."
              onReset={() => setFilterQuery("")}
              resetLabel="Clear search"
            />
          )}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
