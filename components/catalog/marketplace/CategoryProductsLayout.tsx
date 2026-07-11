"use client";

import React from "react";
import {
  SubcategoryFilterBar,
  SubcategoryFilterSidebar,
} from "@/components/catalog/marketplace/SubcategoryPillFilter";
import MarketplaceSearchBar from "@/components/catalog/marketplace/MarketplaceSearchBar";
import LocationFilterBar from "@/components/location/LocationFilterBar";
import PortalProductCard from "@/components/portal/PortalProductCard";
import { portalProductGridClass } from "@/components/portal/portalLayout";
import CatalogLoadMore from "@/components/catalog/CatalogLoadMore";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import {
  MARKETPLACE_CONTAINER,
  MarketplaceProductGridSkeleton,
} from "@/components/catalog/marketplace/marketplaceLayout";
import type { ApiPagination, ApiProductListItem, ApiSubcategory } from "@/types/catalog";

interface CategoryProductsLayoutProps {
  subcategories: ApiSubcategory[];
  selectedSubId: number | null;
  onSelectSub: (id: number | null) => void;
  totalProductCount?: number;
  subPagination?: ApiPagination;
  loadingSubs?: boolean;
  loadingMoreSubs?: boolean;
  onLoadMoreSubs?: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  stateId: string;
  cityId: string;
  onStateChange: (stateId: string) => void;
  onCityChange: (cityId: string) => void;
  onClearFilters: () => void;
  clearFiltersDisabled?: boolean;
  products: ApiProductListItem[];
  subcategoryLabel?: string;
  pagination: ApiPagination;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyReset?: () => void;
  emptyResetLabel?: string;
  resultsLabel?: string;
}

export default function CategoryProductsLayout({
  subcategories,
  selectedSubId,
  onSelectSub,
  totalProductCount,
  subPagination,
  loadingSubs,
  loadingMoreSubs,
  onLoadMoreSubs,
  search,
  onSearchChange,
  searchPlaceholder,
  stateId,
  cityId,
  onStateChange,
  onCityChange,
  onClearFilters,
  clearFiltersDisabled = false,
  products,
  subcategoryLabel,
  pagination,
  loading,
  loadingMore,
  onLoadMore,
  emptyTitle = "No products found",
  emptyDescription = "Try a different search term or browse other subcategories.",
  onEmptyReset,
  emptyResetLabel = "Clear filters",
  resultsLabel,
}: CategoryProductsLayoutProps) {
  const totalSubs = subPagination?.total ?? subcategories.length;
  const showSidebar = totalSubs > 0 || loadingSubs;
  const filterProps = {
    subcategories,
    selectedSubId,
    onSelect: onSelectSub,
    totalProductCount,
    subPagination,
    loadingSubs,
    loadingMoreSubs,
    onLoadMoreSubs,
  };

  return (
    <section className={`${MARKETPLACE_CONTAINER} flex-1 pb-10 pt-4 lg:pb-14 lg:pt-8`}>
      {showSidebar && <SubcategoryFilterBar {...filterProps} />}

      <div className={`flex flex-col ${showSidebar ? "lg:flex-row lg:gap-10 xl:gap-12" : ""}`}>
        {showSidebar && <SubcategoryFilterSidebar {...filterProps} />}

        <div className="min-w-0 flex-1">
          <div className={`mb-6 space-y-3 lg:mb-8${showSidebar ? " mt-5 lg:mt-0" : ""}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <MarketplaceSearchBar
                size="sm"
                value={search}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                className="max-w-md lg:max-w-sm lg:flex-1"
              />
              {resultsLabel && products.length > 0 && (
                <p className="shrink-0 text-sm font-medium text-slate-500">{resultsLabel}</p>
              )}
            </div>
            <LocationFilterBar
              idPrefix="category-products"
              stateId={stateId}
              cityId={cityId}
              onStateChange={onStateChange}
              onCityChange={onCityChange}
              onClear={onClearFilters}
              clearDisabled={clearFiltersDisabled}
            />
          </div>

          {loading && products.length === 0 ? (
            <MarketplaceProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <>
              <div className={`${portalProductGridClass} gap-4`}>
                {products.map((product) => (
                  <PortalProductCard
                    key={product.id}
                    product={product}
                    href={`/products/${product.id}`}
                    subcategoryLabel={subcategoryLabel}
                  />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-6">
                  <MarketplaceProductGridSkeleton count={4} />
                </div>
              )}

              <CatalogLoadMore
                pagination={pagination}
                loading={loading}
                loadingMore={loadingMore}
                onLoadMore={onLoadMore}
                autoLoad
                itemLabel="products"
              />
            </>
          ) : (
            <div className="rounded-2xl bg-white shadow-sm">
              <CatalogEmptyState
                title={emptyTitle}
                description={emptyDescription}
                onReset={onEmptyReset}
                resetLabel={emptyResetLabel}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
