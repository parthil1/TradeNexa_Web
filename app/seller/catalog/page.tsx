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
import {
  approvalTabToApiStatus,
  formatApprovalStatusTabLabel,
  SELLER_PRODUCT_APPROVAL_TABS,
  type SellerProductApprovalTab,
} from "@/utils/productApprovalHelpers";

export default function SellerCatalogPage() {
  const links = sellerCatalogProductLinks();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<SellerProductApprovalTab>("all");
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetchPage = useCallback(
    (page: number) =>
      fetchMyProducts({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        sort_by: "created_at",
        sort_order: "desc",
        approval_status: approvalTabToApiStatus(activeTab),
      }),
    [debouncedSearch, activeTab]
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
    resetDeps: [debouncedSearch, activeTab],
  });

  function handleProductDeleted(productId: number) {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }

  function handleApprovalUpdated(
    productId: number,
    approvalStatus: NonNullable<(typeof products)[number]["approval_status"]>
  ) {
    const matchesTab =
      activeTab === "all" || approvalTabToApiStatus(activeTab) === approvalStatus;
    setItems((prev) => {
      if (!matchesTab) return prev.filter((item) => item.id !== productId);
      return prev.map((item) =>
        item.id === productId ? { ...item, approval_status: approvalStatus } : item
      );
    });
  }

  const hasSearch = debouncedSearch.trim().length > 0;
  const tabLabel = formatApprovalStatusTabLabel(activeTab).toLowerCase();

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

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-0.5">
        {SELLER_PRODUCT_APPROVAL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              activeTab === tab
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-muted-fg ring-1 ring-border hover:ring-primary/30"
            }`}
          >
            {formatApprovalStatusTabLabel(tab)}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <PortalSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search your products by name..."
        />
        {!loading && (hasSearch || activeTab !== "all") ? (
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
          title={
            hasSearch
              ? "No products found"
              : activeTab === "all"
                ? "No products yet"
                : `No ${tabLabel} products`
          }
          description={
            hasSearch
              ? "Try a different search term or clear the search to see all listings."
              : activeTab === "all"
                ? "Add your first product to start receiving buyer inquiries."
                : `No listings are currently ${tabLabel}.`
          }
          action={
            hasSearch || activeTab !== "all" ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setActiveTab("all");
                }}
              >
                Clear filters
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
                showApprovalStatus
                onDeleted={() => handleProductDeleted(p.id)}
                onApprovalUpdated={(status) => handleApprovalUpdated(p.id, status)}
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
