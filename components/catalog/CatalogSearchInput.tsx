"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface CatalogSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  loading?: boolean;
  className?: string;
}

export default function CatalogSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  resultCount,
  loading = false,
  className = "",
}: CatalogSearchInputProps) {
  const hasValue = value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative flex items-center rounded-2xl border bg-white shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/15 ${
          hasValue ? "border-primary/20" : "border-slate-200"
        }`}
      >
        <div className="pointer-events-none absolute left-4 flex items-center text-slate-400">
          <Search className="h-5 w-5" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-24 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {resultCount !== undefined && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {loading ? "..." : `${resultCount} found`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
