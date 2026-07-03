"use client";

import React from "react";

export function MarketplaceProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="aspect-[4/3] bg-slate-200 lg:aspect-[5/4]" />
          <div className="space-y-2 p-4 lg:p-5">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-5 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketplaceCategoryGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-6 w-40 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const MARKETPLACE_PRODUCT_GRID =
  "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4";

export const MARKETPLACE_CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
