"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface MarketplaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MarketplaceSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: MarketplaceSearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-12 text-sm text-slate-800 shadow-lg shadow-slate-900/10 outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
