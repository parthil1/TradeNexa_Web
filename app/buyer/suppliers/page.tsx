"use client";

import React, { useCallback, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import PortalSearchBar from "@/components/portal/PortalSearchBar";
import SupplierCard from "@/components/portal/SupplierCard";
import { fetchSuppliers } from "@/services/supplierService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";

export default function BuyerSuppliersPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);

  const fetchPage = useCallback(
    (page: number) =>
      fetchSuppliers({
        page,
        limit: 12,
        search: debounced || undefined,
        sort_by: "rating",
        sort_order: "desc",
      }),
    [debounced]
  );

  const { items: suppliers, pagination, loading, loadingMore, error, hasMore, loadMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [debounced],
    });

  const resultsLabel = loading
    ? "Searching..."
    : `${pagination.total.toLocaleString()} supplier${pagination.total === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="Suppliers"
        subtitle="Verified sellers ranked by rating"
      />

      <div className="mb-5 space-y-2 sm:mb-6">
        <PortalSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search suppliers by name or industry..."
        />
        <p className="text-xs text-muted-fg sm:text-sm">{resultsLabel}</p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-error/20 bg-error-soft p-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading suppliers...
        </div>
      ) : suppliers.length === 0 ? (
        <PortalEmptyState
          icon={Building2}
          title="No suppliers found"
          description="Try a different search term."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
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
