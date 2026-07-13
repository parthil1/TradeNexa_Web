"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { useWishlist } from "@/hooks/useWishlist";
import { fetchWishlist } from "@/services/wishlistService";
import type { ApiProductListItem } from "@/types/catalog";

export default function BuyerWishlistPage() {
  const { removeFromWishlist, refreshWishlist, syncFromProducts } = useWishlist();
  const [products, setProducts] = useState<ApiProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState<ApiProductListItem | null>(null);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { results, pagination } = await fetchWishlist({ page: pageNum, limit: 20 });
      const wishlisted = results.map((product) => ({ ...product, is_wishlist: true as const }));
      setProducts((prev) => (append ? [...prev, ...wishlisted] : wishlisted));
      syncFromProducts(wishlisted, pagination.total);
      setTotal(pagination.total);
      setHasMore(pageNum < pagination.totalPages);
      setPage(pageNum);
    } catch {
      if (!append) setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [syncFromProducts]);

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  async function handleRemove(product: ApiProductListItem) {
    await removeFromWishlist(product.id);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setTotal((prev) => Math.max(0, prev - 1));
    setConfirmRemove(null);
    void refreshWishlist();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalPageHeader title="Wishlist" subtitle="Products you've saved" />
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading wishlist...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalPageHeader title="Wishlist" subtitle="Products you've saved" />
        <PortalEmptyState
          icon={Heart}
          title="No saved products yet"
          description="Browse products and tap the heart icon to save them here."
          action={
            <Link href="/buyer/search" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
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
        title={`Wishlist (${total})`}
        subtitle="Products you've saved"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <PortalProductCard
            key={product.id}
            product={{ ...product, is_wishlist: true }}
            showWishlist
            onWishlistToggle={() => setConfirmRemove(product)}
          />
        ))}
      </div>

      <PortalInfiniteScroll
        hasMore={hasMore}
        loading={loading}
        loadingMore={loadingMore}
        onLoadMore={() => void loadPage(page + 1, true)}
      />

      {confirmRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Remove from Wishlist?</h3>
            <p className="mt-2 text-sm text-muted-fg">
              Are you sure you want to remove &quot;{confirmRemove.name}&quot; from your wishlist?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-fg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRemove(confirmRemove)}
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
