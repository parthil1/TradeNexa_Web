"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiPagination } from "@/types/catalog";

interface PaginationControlsProps {
  pagination: ApiPagination;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function PaginationControls({
  pagination,
  onPageChange,
  loading = false,
}: PaginationControlsProps) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-muted-fg">
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
        <span className="mx-2 text-border">·</span>
        {total.toLocaleString()} total
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
