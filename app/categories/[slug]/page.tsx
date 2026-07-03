"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CTABanner from "@/components/CTABanner";
import CatalogBreadcrumbs from "@/components/catalog/CatalogBreadcrumbs";
import CatalogImage from "@/components/catalog/CatalogImage";
import SubcategoryCard from "@/components/catalog/SubcategoryCard";
import ProductCard from "@/components/catalog/ProductCard";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { CatalogGridSkeleton } from "@/components/catalog/CatalogSkeleton";
import { fetchCategoryBySlug, fetchProducts } from "@/services/catalogService";
import type { ApiCategoryDetail, ApiProductListItem } from "@/types/catalog";
import { Layers, Package, ArrowRight } from "lucide-react";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";
import { resolveImageUrl } from "@/utils/catalogHelpers";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");

  const [category, setCategory] = useState<ApiCategoryDetail | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<ApiProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchCategoryBySlug(slug);
        if (!detail) {
          if (!cancelled) setError("Category not found");
          return;
        }
        if (!cancelled) setCategory(detail);

        const products = await fetchProducts({
          category_id: detail.id,
          page: 1,
          limit: 4,
          sort_by: "created_at",
          sort_order: "desc",
        });
        if (!cancelled) setFeaturedProducts(products.results);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load category");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const subcategories = (category?.subcategories ?? []).filter((s) => s.is_active);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <CatalogEmptyState
          title="Category not found"
          description={error}
          onReset={() => window.location.assign("/categories")}
          resetLabel="Back to categories"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        {category?.image || category?.icon ? (
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(category.image || category.icon) || ""}
              alt=""
              className="h-full w-full object-cover blur-2xl"
            />
          </div>
        ) : null}

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading || !category ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="h-10 w-2/3 rounded bg-slate-200" />
            </div>
          ) : (
            <>
              <CatalogBreadcrumbs
                items={[{ label: "Categories", href: "/categories" }, { label: category.name }]}
              />
              <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100">
                  <CatalogImage
                    src={category.icon || category.image}
                    alt={category.name}
                    fallbackIcon={getCategoryFallbackIcon(category.slug, category.name)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    {category.name}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Choose a subcategory to browse products from verified sellers
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100">
                      <Layers className="h-4 w-4 text-primary" />
                      {subcategories.length} subcategories
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100">
                      <Package className="h-4 w-4 text-primary" />
                      {(category.product_count ?? 0).toLocaleString()} products
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <CatalogGridSkeleton count={6} />
          ) : category ? (
            <>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Subcategories</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Select a segment to view products</p>
                </div>
                <Link
                  href={`/products?category_id=${category.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                >
                  All products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {subcategories.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {subcategories.map((sub, i) => (
                    <SubcategoryCard
                      key={sub.id}
                      subcategory={sub}
                      delay={i * 0.04}
                    />
                  ))}
                </div>
              ) : (
                <CatalogEmptyState
                  title="No subcategories yet"
                  description="Products may still be available directly in this category."
                />
              )}

              {featuredProducts.length > 0 && (
                <div className="mt-16">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Popular in {category.name}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">Top listings buyers are viewing</p>
                    </div>
                    <Link
                      href={`/products?category_id=${category.id}`}
                      className="text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                      See all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {featuredProducts.map((product, i) => (
                      <ProductCard key={product.id} product={product} delay={i * 0.04} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
