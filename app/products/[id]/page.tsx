"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";
import CTABanner from "@/components/CTABanner";
import PortalProductDetailView from "@/components/portal/PortalProductDetailView";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import {
  fetchCategoryById,
  fetchProductById,
  fetchRelatedProducts,
} from "@/services/catalogService";
import type { ApiProductDetail, ApiProductListItem } from "@/types/catalog";
import { useWishlist } from "@/hooks/useWishlist";
import { websiteProductLinks } from "@/utils/productDetailLinks";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = Number(params.id);
  const invalidId = !productId || Number.isNaN(productId);

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [similarProducts, setSimilarProducts] = useState<ApiProductListItem[]>([]);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState<string | null>(null);
  const { addToWishlist } = useWishlist();

  useEffect(() => {
    if (invalidId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProductById(productId);
        if (cancelled) return;

        if (!data) {
          setProduct(null);
          setError("Product not found");
          return;
        }

        setProduct(data);

        if (data.user_actions?.is_favourite) {
          addToWishlist(data.id);
        }

        const categoryId = data.basic_details.category?.id;
        if (categoryId) {
          try {
            const category = await fetchCategoryById(categoryId);
            if (!cancelled && category?.slug) {
              setCategorySlug(category.slug);
            }
          } catch {
            // Category slug is optional for links
          }
        }

        const subcategoryId = data.basic_details.subcategory?.id;
        if (subcategoryId) {
          try {
            const { results } = await fetchRelatedProducts({
              product_id: data.id,
              subcategory_id: subcategoryId,
              page: 1,
              limit: 6,
              sort_by: "name",
              sort_order: "asc",
            });
            if (!cancelled) {
              setSimilarProducts(results);
            }
          } catch {
            if (!cancelled) {
              setSimilarProducts([]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to load product";
          setError(message);
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [productId, invalidId, addToWishlist]);

  const links = useMemo(() => websiteProductLinks(categorySlug), [categorySlug]);

  if (invalidId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-12">
          <PortalEmptyState
            icon={Package}
            title="Invalid product"
            description="The product link is not valid."
            action={
              <Link
                href="/products"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                Browse Products
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-background py-20 text-sm text-muted-fg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-12">
          <PortalEmptyState
            icon={Package}
            title="Product not found"
            description={error || "This product may have been removed or is unavailable."}
            action={
              <Link
                href="/products"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                Browse Products
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalProductDetailView
        product={product}
        similarProducts={similarProducts}
        links={links}
        compact
      />
      <CTABanner />
    </div>
  );
}
