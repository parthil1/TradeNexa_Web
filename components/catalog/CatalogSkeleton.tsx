"use client";

import React from "react";

export function CatalogGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-card p-6"
        >
          <div className="skeleton mb-4 h-12 w-12 rounded-xl" />
          <div className="skeleton mb-2 h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton mt-2 h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-portal-border bg-white shadow-sm"
        >
          <div className="skeleton aspect-[4/3]" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="skeleton mb-8 hidden h-4 w-64 rounded lg:block" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="skeleton aspect-square rounded-2xl lg:col-span-5" />
        <div className="space-y-4 lg:col-span-7">
          <div className="skeleton h-6 w-24 rounded" />
          <div className="skeleton h-10 w-full rounded" />
          <div className="skeleton h-10 w-48 rounded" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-6 w-40 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-14 rounded-xl" />
            <div className="skeleton h-14 rounded-xl" />
          </div>
          <div className="skeleton h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
