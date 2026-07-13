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
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-fg ${
          isSmall ? "left-3 h-4 w-4" : "left-3.5 h-4 w-4"
        }`}
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border-0 bg-white text-foreground shadow-[var(--shadow-card)] outline-none ring-1 ring-border placeholder:text-muted-placeholder focus:ring-2 focus:ring-primary/30 ${
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
          className={`absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-fg transition-colors duration-200 hover:bg-muted hover:text-foreground ${
            isSmall ? "h-6 w-6" : "h-7 w-7"
          }`}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
