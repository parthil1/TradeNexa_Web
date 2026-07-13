"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import PortalProductCard from "@/components/portal/PortalProductCard";
import { portalProductGridClass } from "@/components/portal/portalLayout";
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
    <section className="border-y border-border bg-background py-16">
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
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-border transition hover:bg-primary hover:text-white hover:ring-primary"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length > 0 ? (
          <div className={`${portalProductGridClass} gap-4`}>
            {products.map((product) => (
              <PortalProductCard
                key={product.id}
                product={product}
                href={`/products/${product.id}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-fg">No trending products available right now.</p>
        )}
      </div>
    </section>
  );
}
