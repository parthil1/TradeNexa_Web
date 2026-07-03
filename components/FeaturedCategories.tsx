"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import MarketplaceCategoryRow from "@/components/catalog/marketplace/MarketplaceCategoryRow";
import {
  MARKETPLACE_CONTAINER,
  MarketplaceCategoryGridSkeleton,
} from "@/components/catalog/marketplace/marketplaceLayout";
import { fetchCategories } from "@/services/catalogService";
import type { ApiCategory } from "@/types/catalog";
import { ArrowRight } from "lucide-react";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchCategories({
          page: 1,
          limit: 9,
          is_active: true,
          sort_by: "name",
          sort_order: "asc",
        });
        if (!cancelled) setCategories(data.results);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className={MARKETPLACE_CONTAINER}>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Industries
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1a2b4c] sm:text-4xl">
              Featured Categories
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Discover products across major B2B manufacturing segments.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/10 transition hover:bg-primary-hover"
          >
            All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <MarketplaceCategoryGridSkeleton count={9} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
