"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import CategoryCard from "@/components/CategoryCard";
import { CatalogGridSkeleton } from "@/components/catalog/CatalogSkeleton";
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
          limit: 10,
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
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Featured Industries</h2>
            <p className="mt-2 text-sm text-slate-500">
              Discover products across major B2B manufacturing segments.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-slate-100"
          >
            All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <CatalogGridSkeleton count={10} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                slug={cat.slug}
                imageUrl={cat.icon || cat.image}
                title={cat.name}
                productCount={cat.product_count ?? 0}
                subcategoryCount={cat.subcategory_count}
                href={`/categories/${cat.slug}`}
                delay={i * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
