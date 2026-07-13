"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import LocationFilterBar from "@/components/location/LocationFilterBar";
import { fetchProducts } from "@/services/catalogService";
import { useCityFilter } from "@/hooks/useCityFilter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";

export default function BuyerSearchPage() {
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 400);
  const {
    stateId,
    stateLabel,
    cityId,
    cityLabel,
    setCityId,
    handleStateChange,
    clearLocationFilters,
    clearStateFilter,
    clearCityFilter,
    hasLocationFilter,
    cityFilterParams,
  } = useCityFilter({ syncFromGeo: true });

  const fetchPage = useCallback(
    (page: number) =>
      fetchProducts({
        page,
        limit: 12,
        search: debounced || undefined,
        sort_by: "name",
        sort_order: "asc",
        ...cityFilterParams,
      }),
    [cityFilterParams, debounced]
  );

  const { items: products, pagination, loading, loadingMore, error, hasMore, loadMore } =
    useLoadMoreList({
      fetchPage,
      resetDeps: [debounced, cityId],
    });

  const hasAnyFilter = Boolean(query.trim() || hasLocationFilter);

  function clearFilters() {
    setQuery("");
    clearLocationFilters();
  }

  const resultsLabel = loading
    ? "Searching..."
    : `${pagination.total.toLocaleString()} product${pagination.total === 1 ? "" : "s"} found`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Search Products" subtitle="Find suppliers and products across India" />
      <div className="mb-6 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-fg" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, category, or supplier..."
            className={`w-full rounded-2xl border border-border bg-white py-3.5 pl-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              query ? "pr-12" : "pr-4"
            }`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-fg transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <LocationFilterBar
          idPrefix="buyer-search"
          variant="toolbar"
          stateId={stateId}
          stateLabel={stateLabel}
          cityId={cityId}
          cityLabel={cityLabel}
          onStateChange={handleStateChange}
          onCityChange={setCityId}
          onClear={clearFilters}
          onClearState={clearStateFilter}
          onClearCity={clearCityFilter}
          clearDisabled={!hasAnyFilter}
          resultsLabel={resultsLabel}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Searching...
        </div>
      ) : products.length === 0 ? (
        <PortalEmptyState
          icon={Search}
          title="No products found"
          description="Try a different search term, city, or browse categories."
          action={
            <Link href="/buyer/categories" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
              Browse Categories
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <PortalProductCard key={p.id} product={p} />
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
