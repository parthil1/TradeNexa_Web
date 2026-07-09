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
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-portal-muted" />
      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-portal-border bg-white py-3 pl-11 pr-10 text-sm shadow-sm outline-none transition focus:border-portal-buyer focus:ring-2 focus:ring-portal-buyer/20"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-portal-muted transition hover:bg-portal-bg hover:text-portal-buyer"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
