"use client";

import React from "react";
import Link from "next/link";
import MarketplaceCategoryRow from "@/components/catalog/marketplace/MarketplaceCategoryRow";
import {
  MARKETPLACE_CONTAINER,
  MarketplaceCategoryGridSkeleton,
} from "@/components/catalog/marketplace/marketplaceLayout";
import { useGetCategoriesQuery } from "@/store/api/referenceApi";
import { ArrowRight } from "lucide-react";

const FEATURED_COUNT = 9;

export default function FeaturedCategories() {
  // Shares one cached category list with the rest of the app.
  const { data, isLoading } = useGetCategoriesQuery();
  const categories = React.useMemo(() => (data ?? []).slice(0, FEATURED_COUNT), [data]);
  const loading = isLoading;

  return (
    <section className="bg-background py-12 lg:py-16">
      <div className={MARKETPLACE_CONTAINER}>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Industries
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Featured Categories
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-fg">
              Discover products across major B2B manufacturing segments.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-colors hover:bg-primary-hover"
          >
            All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <MarketplaceCategoryGridSkeleton count={FEATURED_COUNT} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat, i) => (
              <MarketplaceCategoryRow
                key={cat.id}
                slug={cat.slug}
                imageUrl={cat.icon || cat.image}
                title={cat.name}
                productCount={cat.product_count ?? 0}
                subcategoryCount={cat.subcategory_count}
                href={`/categories/${cat.slug}`}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
