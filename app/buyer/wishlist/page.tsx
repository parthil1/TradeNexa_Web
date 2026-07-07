"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalProductCard from "@/components/portal/PortalProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { fetchWishlistProducts } from "@/services/wishlistService";
import type { ApiProductListItem } from "@/types/catalog";

export default function BuyerWishlistPage() {
  const { wishlistedIds, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<ApiProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<ApiProductListItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const items = await fetchWishlistProducts(wishlistedIds);
      if (!cancelled) {
        setProducts(items);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [wishlistedIds]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalPageHeader title="Wishlist" subtitle="Products you've saved" />
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Loading wishlist...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalPageHeader title="Wishlist" subtitle="Products you've saved" />
        <PortalEmptyState
          icon={Heart}
          title="No saved products yet"
          description="Browse products and tap the heart icon to save them here."
          action={
            <Link href="/buyer/search" className="rounded-xl bg-[#1565C0] px-4 py-2 text-sm font-bold text-white">
              Browse Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title={`Wishlist (${products.length})`}
        subtitle="Products you've saved"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <PortalProductCard
            key={product.id}
            product={product}
            onWishlistToggle={() => setConfirmRemove(product)}
          />
        ))}
      </div>

      {confirmRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0D1B2A]">Remove from Wishlist?</h3>
            <p className="mt-2 text-sm text-[#546E7A]">
              Are you sure you want to remove &quot;{confirmRemove.name}&quot; from your wishlist?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[#546E7A] hover:bg-[#F4F6F9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeFromWishlist(confirmRemove.id);
                  setConfirmRemove(null);
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
