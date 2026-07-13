"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { fetchSuppliers } from "@/services/supplierService";
import type { ApiSupplier } from "@/types/supplier";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface SellerMultiSelectProps {
  selectedIds: number[];
  selectedSellers: ApiSupplier[];
  onChange: (ids: number[], sellers: ApiSupplier[]) => void;
  error?: boolean;
  disabled?: boolean;
}

function sellerLabel(seller: ApiSupplier): string {
  const place = [seller.city, seller.state].filter(Boolean).join(", ");
  return place ? `${seller.company_name} · ${place}` : seller.company_name;
}

export default function SellerMultiSelect({
  selectedIds,
  selectedSellers,
  onChange,
  error,
  disabled,
}: SellerMultiSelectProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<ApiSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const { results: rows, pagination } = await fetchSuppliers({
          page: pageNum,
          limit: 10,
          search: debouncedQuery || undefined,
          sort_by: "company_name",
          sort_order: "asc",
        });
        setResults((prev) => (append ? [...prev, ...rows] : rows));
        setPage(pageNum);
        setHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!append) setResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery]
  );

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  function toggleSeller(seller: ApiSupplier) {
    if (disabled) return;
    if (selectedSet.has(seller.id)) {
      onChange(
        selectedIds.filter((id) => id !== seller.id),
        selectedSellers.filter((s) => s.id !== seller.id)
      );
      return;
    }
    onChange([...selectedIds, seller.id], [...selectedSellers, seller]);
  }

  function removeSeller(id: number) {
    if (disabled) return;
    onChange(
      selectedIds.filter((sid) => sid !== id),
      selectedSellers.filter((s) => s.id !== id)
    );
  }

  return (
    <div className="space-y-3">
      {selectedSellers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedSellers.map((seller) => (
            <span
              key={seller.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
            >
              <span className="truncate">{seller.company_name}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeSeller(seller.id)}
                className="shrink-0 rounded-full p-0.5 transition hover:bg-primary/15 disabled:opacity-50"
                aria-label={`Remove ${seller.company_name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={`overflow-hidden rounded-xl border bg-white ${
          error ? "border-red-400" : "border-border"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-fg" />
          <input
            type="search"
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sellers by company name..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-fg disabled:opacity-50"
          />
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : null}
        </div>

        <ul className="max-h-56 overflow-y-auto py-1">
          {results.length === 0 && !loading ? (
            <li className="px-3 py-4 text-center text-xs text-muted-fg">
              {debouncedQuery.trim() ? "No sellers found" : "No sellers available"}
            </li>
          ) : (
            results.map((seller) => {
              const checked = selectedSet.has(seller.id);
              return (
                <li key={seller.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSeller(seller)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-muted disabled:opacity-50 ${
                      checked ? "bg-primary-soft/50" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white"
                      }`}
                      aria-hidden
                    >
                      {checked ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[2]">
                          <path d="M2.5 6.5 5 9l4.5-5.5" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {seller.company_name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-fg">
                        {sellerLabel(seller)}
                        {seller.verified ? " · Verified" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
          {hasMore ? (
            <li className="border-t border-border px-3 py-2">
              <button
                type="button"
                disabled={loadingMore || disabled}
                onClick={() => void loadPage(page + 1, true)}
                className="w-full rounded-lg py-1.5 text-xs font-bold text-primary transition hover:bg-primary-soft disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
