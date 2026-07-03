"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import type { ApiPagination, ApiSubcategory } from "@/types/catalog";

interface SubcategoryFilterProps {
  subcategories: ApiSubcategory[];
  selectedSubId: number | null;
  onSelect: (subId: number | null) => void;
  totalProductCount?: number;
  subPagination?: ApiPagination;
  loadingSubs?: boolean;
  loadingMoreSubs?: boolean;
  onLoadMoreSubs?: () => void;
}

function FilterButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition lg:w-full lg:justify-between lg:rounded-xl lg:px-4 lg:py-3 lg:text-left ${
        isActive
          ? "bg-[#3d2914] text-white shadow-md lg:border-l-4 lg:border-primary lg:bg-primary/5 lg:text-primary lg:shadow-none"
          : "bg-transparent text-[#1a2b4c] hover:bg-slate-50 lg:text-slate-700 lg:hover:bg-slate-100"
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            isActive
              ? "bg-white/25 text-white lg:bg-primary/10 lg:text-primary"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function useFilterItems(
  subcategories: ApiSubcategory[],
  totalProductCount?: number
) {
  const allCount =
    totalProductCount ??
    subcategories.reduce((sum, s) => sum + (s.product_count ?? 0), 0);
  return { allCount };
}

function SubcategoryLoadMoreButton({
  subPagination,
  loadingSubs,
  loadingMoreSubs,
  onLoadMoreSubs,
  className = "",
}: Pick<
  SubcategoryFilterProps,
  "subPagination" | "loadingSubs" | "loadingMoreSubs" | "onLoadMoreSubs"
> & { className?: string }) {
  if (!subPagination || !onLoadMoreSubs) return null;
  const hasMore = subPagination.page < subPagination.totalPages;
  if (!hasMore) return null;

  return (
    <button
      type="button"
      onClick={onLoadMoreSubs}
      disabled={loadingSubs || loadingMoreSubs}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:opacity-50 lg:mt-2 lg:w-full lg:rounded-xl lg:py-2.5 lg:text-sm ${className}`}
    >
      {loadingMoreSubs ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading...
        </>
      ) : (
        `Load more (${subPagination.page}/${subPagination.totalPages})`
      )}
    </button>
  );
}

export function SubcategoryFilterBar({
  subcategories,
  selectedSubId,
  onSelect,
  totalProductCount,
  subPagination,
  loadingSubs,
  loadingMoreSubs,
  onLoadMoreSubs,
}: SubcategoryFilterProps) {
  const { allCount } = useFilterItems(subcategories, totalProductCount);

  return (
    <div className="border-b border-slate-100 bg-white lg:hidden">
      <div className="flex gap-2.5 overflow-x-auto py-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterButton
          label="All"
          count={allCount}
          isActive={selectedSubId === null}
          onClick={() => onSelect(null)}
        />
        {subcategories.map((sub) => (
          <FilterButton
            key={sub.id}
            label={sub.name}
            count={sub.product_count ?? 0}
            isActive={selectedSubId === sub.id}
            onClick={() => onSelect(sub.id)}
          />
        ))}
        <SubcategoryLoadMoreButton
          subPagination={subPagination}
          loadingSubs={loadingSubs}
          loadingMoreSubs={loadingMoreSubs}
          onLoadMoreSubs={onLoadMoreSubs}
        />
      </div>
    </div>
  );
}

export function SubcategoryFilterSidebar({
  subcategories,
  selectedSubId,
  onSelect,
  totalProductCount,
  subPagination,
  loadingSubs,
  loadingMoreSubs,
  onLoadMoreSubs,
}: SubcategoryFilterProps) {
  const { allCount } = useFilterItems(subcategories, totalProductCount);
  const totalSubs = subPagination?.total ?? subcategories.length;

  return (
    <aside className="hidden lg:block lg:w-72 lg:shrink-0 xl:w-80">
      <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Subcategories
          </h3>
          {subPagination && (
            <span className="text-[11px] font-semibold text-slate-400">
              {subcategories.length}/{totalSubs}
            </span>
          )}
        </div>
        <nav className="flex max-h-[min(60vh,520px)] flex-col gap-1 overflow-y-auto pr-1">
          <FilterButton
            label="All products"
            count={allCount}
            isActive={selectedSubId === null}
            onClick={() => onSelect(null)}
          />
          {subcategories.map((sub) => (
            <FilterButton
              key={sub.id}
              label={sub.name}
              count={sub.product_count ?? 0}
              isActive={selectedSubId === sub.id}
              onClick={() => onSelect(sub.id)}
            />
          ))}
        </nav>
        <SubcategoryLoadMoreButton
          subPagination={subPagination}
          loadingSubs={loadingSubs}
          loadingMoreSubs={loadingMoreSubs}
          onLoadMoreSubs={onLoadMoreSubs}
        />
      </div>
    </aside>
  );
}

/** @deprecated Use SubcategoryFilterBar + SubcategoryFilterSidebar in layout */
export default function SubcategoryPillFilter(props: SubcategoryFilterProps) {
  return (
    <>
      <SubcategoryFilterBar {...props} />
      <SubcategoryFilterSidebar {...props} />
    </>
  );
}
