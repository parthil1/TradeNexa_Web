"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function CatalogBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-primary"
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          {item.href ? (
            <Link href={item.href} className="font-medium text-slate-500 transition-colors hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-900">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
