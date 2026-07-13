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
        className={`relative flex items-center rounded-2xl border bg-card shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/15 ${
          hasValue ? "border-primary/20" : "border-border"
        }`}
      >
        <div className="pointer-events-none absolute left-4 flex items-center text-muted-fg">
          <Search className="h-5 w-5" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-24 text-sm text-foreground placeholder:text-muted-fg outline-none"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {resultCount !== undefined && (
            <span className="rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-fg">
              {loading ? "..." : `${resultCount} found`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
