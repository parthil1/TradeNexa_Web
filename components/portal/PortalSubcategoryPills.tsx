"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import type { ApiPagination, ApiSubcategory } from "@/types/catalog";

interface PortalSubcategoryPillsProps {
  subcategories: ApiSubcategory[];
  selectedSubId: number | null;
  onSelect: (subId: number | null) => void;
  totalProductCount?: number;
  subPagination?: ApiPagination;
  loadingSubs?: boolean;
  loadingMoreSubs?: boolean;
  onLoadMoreSubs?: () => void;
}

function Pill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-portal-buyer text-white shadow-sm"
          : "bg-portal-buyer-light text-portal-buyer hover:bg-portal-buyer-light/80"
      }`}
    >
      <span>{label}</span>
      {count !== undefined ? (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-white/80 text-portal-buyer"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export default function PortalSubcategoryPills({
  subcategories,
  selectedSubId,
  onSelect,
  totalProductCount,
  subPagination,
  loadingSubs,
  loadingMoreSubs,
  onLoadMoreSubs,
}: PortalSubcategoryPillsProps) {
  const allCount =
    totalProductCount ?? subcategories.reduce((sum, s) => sum + (s.product_count ?? 0), 0);
  const hasMoreSubs = subPagination && subPagination.page < subPagination.totalPages;

  if (loadingSubs && subcategories.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-2 text-xs text-portal-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-portal-buyer" />
        Loading subcategories...
      </div>
    );
  }

  if (subcategories.length === 0) return null;

  return (
    <div className="mt-4 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="overflow-x-auto overflow-y-hidden px-4 pb-1 sm:px-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full flex-nowrap items-center gap-2">
          <Pill label="All" count={allCount} active={selectedSubId === null} onClick={() => onSelect(null)} />
          {subcategories.map((sub) => (
            <Pill
              key={sub.id}
              label={sub.name}
              count={sub.product_count ?? 0}
              active={selectedSubId === sub.id}
              onClick={() => onSelect(sub.id)}
            />
          ))}
          {hasMoreSubs && onLoadMoreSubs ? (
            <button
              type="button"
              onClick={onLoadMoreSubs}
              disabled={loadingSubs || loadingMoreSubs}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-portal-border bg-white px-3 py-1.5 text-xs font-semibold text-portal-muted shadow-sm transition hover:border-portal-buyer hover:text-portal-buyer disabled:opacity-50"
            >
              {loadingMoreSubs ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                `More (${subPagination.page}/${subPagination.totalPages})`
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
