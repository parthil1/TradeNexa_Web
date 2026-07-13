"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiPagination } from "@/types/catalog";

interface PortalPaginationProps {
  pagination: ApiPagination;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemLabel?: string;
  compact?: boolean;
}

export default function PortalPagination({
  pagination,
  onPageChange,
  loading = false,
  itemLabel = "items",
  compact = false,
}: PortalPaginationProps) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  const btnClass = `inline-flex cursor-pointer items-center gap-1 border border-border bg-white font-semibold text-muted-fg transition-colors duration-200 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 ${
    compact ? "rounded-lg px-3 py-1.5 text-xs" : "rounded-lg px-4 py-2 text-sm"
  }`;

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${
        compact ? "mt-5 border-t border-border pt-4" : "mt-6"
      }`}
    >
      <p className={`text-muted-fg ${compact ? "text-xs" : "text-sm"}`}>
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
        <span className="mx-2 text-border">·</span>
        {total.toLocaleString()} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className={btnClass}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className={btnClass}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
