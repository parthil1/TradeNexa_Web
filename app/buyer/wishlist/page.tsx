"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import { Button } from "@/components/common/Button";
import { useWishlist } from "@/hooks/useWishlist";
import { useGetWishlistQuery } from "@/store/api/wishlistApi";
import type { ApiProductListItem } from "@/types/catalog";

const PAGE_LIMIT = 20;

export default function BuyerWishlistPage() {
  const { removeFromWishlist, syncFromProducts } = useWishlist();
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ApiProductListItem[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<ApiProductListItem | null>(null);

  // Shares the RTK Query cache with WishlistProvider (same endpoint, different
  // page args). Toggle invalidation refreshes both subscribers once.
  const { data, isLoading, isFetching } = useGetWishlistQuery({
    page,
    limit: PAGE_LIMIT,
  });

  useEffect(() => {
    if (!data) return;
    const wishlisted = data.results.map((product) => ({
      ...product,
      is_wishlist: true as const,
    }));
    setProducts((prev) => (page === 1 ? wishlisted : [...prev, ...wishlisted]));
    syncFromProducts(wishlisted, data.total);
  }, [data, page, syncFromProducts]);

  const total = data?.total ?? products.length;
  const hasMore = Boolean(data && data.page < data.totalPages);
  const loading = isLoading && page === 1 && products.length === 0;
  const loadingMore = isFetching && page > 1;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    setPage((prev) => prev + 1);
  }, [hasMore, loading, loadingMore]);

  const handleWishlistToggle = useCallback((product: ApiProductListItem) => {
    setConfirmRemove(product);
  }, []);

  async function handleRemove(product: ApiProductListItem) {
    await removeFromWishlist(product.id);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setConfirmRemove(null);
    // Mutation invalidates the Wishlist tag — no second refreshWishlist call.
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
            <Link href="/buyer/search">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title={`Wishlist (${total})`} subtitle="Products you've saved" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <PortalProductCard
            key={product.id}
            product={product}
            showWishlist
            onWishlistToggle={handleWishlistToggle}
          />
        ))}
      </div>

      <PortalInfiniteScroll
        hasMore={hasMore}
        loading={loading}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />

      {confirmRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-foreground">Remove from Wishlist?</h3>
            <p className="mt-2 text-sm text-muted-fg">
              Are you sure you want to remove &quot;{confirmRemove.name}&quot; from your wishlist?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmRemove(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void handleRemove(confirmRemove)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
