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
    <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-12 sm:py-14">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {breadcrumbs && <CatalogBreadcrumbs items={breadcrumbs} />}

        {badge && (
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-base text-slate-500">{subtitle}</p>
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
