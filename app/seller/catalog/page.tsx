"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import PortalSearchBar from "@/components/portal/PortalSearchBar";
import { Button } from "@/components/common/Button";
import { fetchMyProducts } from "@/services/catalogService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { sellerCatalogProductLinks } from "@/utils/productDetailLinks";

export default function SellerCatalogPage() {
  const links = sellerCatalogProductLinks();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetchPage = useCallback(
    (page: number) =>
      fetchMyProducts({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        sort_by: "created_at",
        sort_order: "desc",
      }),
    [debouncedSearch]
  );

  const {
    items: products,
    pagination,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    setItems,
  } = useLoadMoreList({
    fetchPage,
    resetDeps: [debouncedSearch],
  });

  function handleProductDeleted(productId: number) {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }

  const hasSearch = debouncedSearch.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="My Catalog"
        subtitle="Manage your product listings"
        action={
          <Link href="/seller/add-product">
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              Add Product
            </Button>
          </Link>
        }
      />

      <div className="mb-6">
        <PortalSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search your products by name..."
        />
        {!loading && hasSearch ? (
          <p className="mt-2 text-xs text-muted-fg">
            {pagination.total === 0
              ? "No matches"
              : `${pagination.total} product${pagination.total === 1 ? "" : "s"} found`}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          {hasSearch ? "Searching..." : "Loading catalog..."}
        </div>
      ) : products.length === 0 ? (
        <PortalEmptyState
          icon={Search}
          title={hasSearch ? "No products found" : "No products yet"}
          description={
            hasSearch
              ? "Try a different search term or clear the search to see all listings."
              : "Add your first product to start receiving buyer inquiries."
          }
          action={
            hasSearch ? (
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            ) : (
              <Link href="/seller/add-product">
                <Button>Add Product</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <PortalProductCard
                key={p.id}
                product={p}
                href={links.product(p.id)}
                editHref={links.editProduct?.(p.id)}
                showDelete
                showWishlist={false}
                onDeleted={() => handleProductDeleted(p.id)}
              />
            ))}
          </div>
          <PortalInfiniteScroll
            hasMore={hasMore}
            loading={loading}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </>
      )}
    </div>
  );
}
