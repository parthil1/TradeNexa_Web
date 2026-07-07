"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import ProductCard from "@/components/catalog/ProductCard";
import { ProductGridSkeleton } from "@/components/catalog/CatalogSkeleton";
import { fetchTrendingProductItems } from "@/services/catalogService";
import type { ApiProductListItem } from "@/types/catalog";
import { ArrowRight } from "lucide-react";

export default function TrendingProducts() {
  const [products, setProducts] = useState<ApiProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchTrendingProductItems(8);
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setProducts([]);
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
    <section className="border-y border-slate-100 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="max-w-2xl">
            <SectionHeading
              badge="Popular Now"
              title="Trending Products"
              subtitle="High-demand B2B listings getting the most buyer interest on TradeNexa."
              centered={false}
            />
          </div>
          <Link
            href="/products?trending=true"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-slate-200 transition hover:bg-primary hover:text-white hover:ring-primary"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={i * 0.05} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">No trending products available right now.</p>
        )}
      </div>
    </section>
  );
}
