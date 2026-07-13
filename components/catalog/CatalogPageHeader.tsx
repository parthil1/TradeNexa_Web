"use client";

import React from "react";
import CatalogBreadcrumbs, { type BreadcrumbItem } from "@/components/catalog/CatalogBreadcrumbs";
import CatalogSearchInput from "@/components/catalog/CatalogSearchInput";

interface CatalogPageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    resultCount?: number;
    loading?: boolean;
  };
  children?: React.ReactNode;
}

export default function CatalogPageHeader({
  badge,
  title,
  subtitle,
  breadcrumbs,
  search,
  children,
}: CatalogPageHeaderProps) {
  return (
    <section className="border-b border-border bg-card py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {breadcrumbs && <CatalogBreadcrumbs items={breadcrumbs} className="mb-3" />}

        {badge && (
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-base text-muted-fg">{subtitle}</p>
        )}

        {search && (
          <CatalogSearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            resultCount={search.resultCount}
            loading={search.loading}
            className="mt-6 max-w-xl"
          />
        )}

        {children}
      </div>
    </section>
  );
}
