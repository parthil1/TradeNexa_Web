"use client";

import React from "react";

export function CatalogGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-6"
        >
          <div className="mb-4 h-12 w-12 rounded-xl bg-slate-200" />
          <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white"
        >
          <div className="h-36 bg-slate-200" />
          <div className="space-y-2 p-5">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-6 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 hidden h-4 w-64 rounded bg-slate-200 lg:block" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="aspect-square rounded-3xl bg-slate-200 lg:col-span-5" />
        <div className="space-y-4 lg:col-span-7">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-200" />
          <div className="h-10 w-48 rounded bg-slate-200" />
          <div className="h-20 rounded-2xl bg-white" />
          <div className="h-6 w-40 rounded bg-slate-100" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 rounded-xl bg-white" />
            <div className="h-14 rounded-xl bg-white" />
          </div>
          <div className="h-12 rounded-xl bg-slate-200" />
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="h-48 rounded-2xl bg-white lg:col-span-8" />
        <div className="h-64 rounded-2xl bg-white lg:col-span-4" />
      </div>
    </div>
  );
}
