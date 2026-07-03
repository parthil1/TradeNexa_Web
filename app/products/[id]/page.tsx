"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import ProductDetailView from "@/components/catalog/ProductDetailView";
import { ProductDetailSkeleton } from "@/components/catalog/CatalogSkeleton";
import { fetchProductById } from "@/services/catalogService";
import type { ApiProductDetail } from "@/types/catalog";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = Number(params.id);

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!productId || Number.isNaN(productId)) {
        setError("Invalid product");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const detail = await fetchProductById(productId);
        if (!detail) {
          if (!cancelled) setError("Product not found");
          return;
        }
        if (!cancelled) setProduct(detail);
      } catch (err) {
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to load product";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <CatalogEmptyState
          title="Product not found"
          description={error || "This product may have been removed."}
          onReset={() => window.location.assign("/products")}
          resetLabel="Browse all products"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ProductDetailView product={product} />
      <CTABanner />
    </div>
  );
}
