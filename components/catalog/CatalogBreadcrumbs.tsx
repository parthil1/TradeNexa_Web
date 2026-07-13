"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CatalogBreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: "default" | "light";
  className?: string;
}

export default function CatalogBreadcrumbs({
  items,
  variant = "default",
  className = "",
}: CatalogBreadcrumbsProps) {
  const isLight = variant === "light";

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-sm ${className}`}
    >
      <Link
        href="/"
        className={`inline-flex items-center gap-1 transition-colors ${
          isLight ? "text-white/70 hover:text-white" : "text-muted-fg hover:text-primary"
        }`}
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 ${isLight ? "text-white/45" : "text-border"}`}
          />
          {item.href ? (
            <Link
              href={item.href}
              className={`font-medium transition-colors ${
                isLight ? "text-white/85 hover:text-white" : "text-muted-fg hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={`font-semibold ${isLight ? "text-white" : "text-foreground"}`}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
