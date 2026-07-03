"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface MarketplaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** `sm` for hero bars; `md` default for content areas */
  size?: "sm" | "md";
}

export default function MarketplaceSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  size = "md",
}: MarketplaceSearchBarProps) {
  const isSmall = size === "sm";

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
          isSmall ? "left-3 h-4 w-4" : "left-3.5 h-4 w-4"
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border-0 bg-white text-slate-800 shadow-md shadow-slate-900/10 outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 ${
          isSmall
            ? "rounded-xl py-2.5 pl-9 pr-9 text-sm"
            : "rounded-xl py-3 pl-10 pr-10 text-sm"
        }`}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${
            isSmall ? "h-6 w-6" : "h-7 w-7"
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
