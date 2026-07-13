"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface PortalSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PortalSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: PortalSearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg"
        aria-hidden
      />
      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-white py-2.5 pl-11 pr-10 text-sm text-foreground shadow-[var(--shadow-card)] outline-none transition-all duration-200 placeholder:text-muted-placeholder hover:border-border-hover focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-fg transition-colors duration-200 hover:bg-portal-bg hover:text-primary"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
