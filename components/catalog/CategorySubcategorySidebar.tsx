"use client";

import React, { useEffect, useRef } from "react";
import { Layers, Loader2 } from "lucide-react";
import type { ApiPagination, ApiSubcategory } from "@/types/catalog";

interface CategorySubcategorySidebarProps {
  subcategories: ApiSubcategory[];
  selectedSubId: number | null;
  onSelect: (subId: number | null) => void;
  totalProductCount?: number;
  subPagination?: ApiPagination;
  loadingSubs?: boolean;
  loadingMoreSubs?: boolean;
  onLoadMoreSubs?: () => void;
  /** Removes outer card chrome when nested inside a parent panel */
  embedded?: boolean;
}

function SubItem({
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
      className={`group flex w-full items-center gap-2.5 rounded-xl border-l-[3px] py-2.5 pl-3 pr-2.5 text-left text-sm transition-all duration-200 ${
        active
          ? "border-portal-buyer bg-portal-buyer-light font-semibold text-portal-buyer shadow-sm shadow-portal-buyer/5"
          : "border-transparent font-medium text-portal-muted hover:border-border hover:bg-background hover:text-portal-fg"
      }`}
    >
      <span className="min-w-0 flex-1 truncate leading-snug">{label}</span>
      {count !== undefined ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
            active ? "bg-portal-buyer/15 text-portal-buyer" : "bg-muted text-muted-fg"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export default function CategorySubcategorySidebar({
  subcategories,
  selectedSubId,
  onSelect,
  totalProductCount,
  subPagination,
  loadingSubs,
  loadingMoreSubs,
  onLoadMoreSubs,
  embedded = false,
}: CategorySubcategorySidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const allCount =
    totalProductCount ?? subcategories.reduce((sum, s) => sum + (s.product_count ?? 0), 0);
  const hasMoreSubs = Boolean(
    subPagination && subPagination.page < subPagination.totalPages && onLoadMoreSubs
  );
  const groupCount = subPagination?.total ?? subcategories.length;

  useEffect(() => {
    if (!hasMoreSubs || !onLoadMoreSubs) return;
    const root = listRef.current;
    const el = sentinelRef.current;
    if (!root || !el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingSubs && !loadingMoreSubs) {
          onLoadMoreSubs();
        }
      },
      { root, rootMargin: "80px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMoreSubs, loadingSubs, loadingMoreSubs, onLoadMoreSubs, subcategories.length]);

  const shellClass = embedded
    ? "flex h-full min-h-0 flex-col"
    : "overflow-hidden rounded-xl border border-portal-border bg-card shadow-sm";

  if (loadingSubs && subcategories.length === 0) {
    return (
      <aside className={shellClass}>
        <div className={`flex items-center gap-2 ${embedded ? "px-1 pb-3" : "border-b border-portal-border px-4 py-3"}`}>
          <Layers className="h-4 w-4 text-portal-buyer" />
          <p className="text-sm font-bold text-portal-fg">Subcategories</p>
        </div>
        <div className="flex items-center gap-2 px-1 py-4 text-xs text-portal-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-portal-buyer" />
          Loading...
        </div>
      </aside>
    );
  }

  if (subcategories.length === 0) return null;

  return (
    <aside className={shellClass}>
      <div
        className={`flex shrink-0 items-center justify-between gap-2 ${
          embedded ? "px-1 pb-3" : "border-b border-portal-border bg-background px-4 py-3"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-4 w-4 shrink-0 text-portal-buyer" />
          <p className="truncate text-sm font-bold text-portal-fg">Subcategories</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-fg">
          {groupCount}
        </span>
      </div>
      <div
        ref={listRef}
        className={`min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] ${
          embedded ? "max-h-[min(52vh,420px)] px-1 lg:max-h-[min(62vh,520px)]" : "max-h-[min(65vh,520px)] p-2"
        } [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border`}
      >
        <SubItem
          label="All products"
          count={allCount}
          active={selectedSubId === null}
          onClick={() => onSelect(null)}
        />
        {subcategories.map((sub) => (
          <SubItem
            key={sub.id}
            label={sub.name}
            count={sub.product_count ?? 0}
            active={selectedSubId === sub.id}
            onClick={() => onSelect(sub.id)}
          />
        ))}
        {hasMoreSubs ? (
          <div className="flex flex-col items-center gap-1 py-2">
            {loadingMoreSubs ? (
              <div className="flex items-center gap-1.5 text-[11px] text-portal-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-portal-buyer" />
                Loading more...
              </div>
            ) : null}
            <div ref={sentinelRef} className="h-2 w-full" aria-hidden />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
