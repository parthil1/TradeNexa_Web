"use client";

import React from "react";
import { Package, RefreshCw } from "lucide-react";

interface CatalogEmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
  resetLabel?: string;
}

export default function CatalogEmptyState({
  title,
  description,
  onReset,
  resetLabel = "Reset filters",
}: CatalogEmptyStateProps) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Package className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
        >
          <RefreshCw className="h-4 w-4" />
          {resetLabel}
        </button>
      )}
    </div>
  );
}
