"use client";

import React, { useCallback } from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import LocationFilterBar from "@/components/location/LocationFilterBar";
import { fetchTrendingProducts } from "@/services/catalogService";
import { useCityFilter } from "@/hooks/useCityFilter";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { Loader2 } from "lucide-react";

export default function BuyerTrendingPage() {
  const {
    stateId,
    cityId,
    setCityId,
    handleStateChange,
    clearLocationFilters,
    hasLocationFilter,
    cityFilterParams,
  } = useCityFilter();

  const fetchPage = useCallback(
    (page: number) =>
      fetchTrendingProducts({
        page,
        limit: 12,
        sort_by: "name",
        sort_order: "asc",
        ...cityFilterParams,
      }),
    [cityFilterParams]
  );

  const { items: products, loading, loadingMore, hasMore, loadMore } = useLoadMoreList({
    fetchPage,
    resetDeps: [cityId],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Trending" subtitle="Most popular B2B listings this week" />
      <LocationFilterBar
        idPrefix="buyer-trending"
        stateId={stateId}
        cityId={cityId}
        onStateChange={handleStateChange}
        onCityChange={setCityId}
        onClear={clearLocationFilters}
        clearDisabled={!hasLocationFilter}
        className="mb-6"
      />
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#546E7A]">
          <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
          Loading...
        </div>
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
