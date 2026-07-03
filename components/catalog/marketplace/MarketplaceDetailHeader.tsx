"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Package } from "lucide-react";
import CatalogBreadcrumbs, { type BreadcrumbItem } from "@/components/catalog/CatalogBreadcrumbs";
import CatalogImage from "@/components/catalog/CatalogImage";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";
import { MARKETPLACE_NAVY } from "@/utils/marketplaceTheme";

interface MarketplaceDetailHeaderProps {
  title: string;
  backHref: string;
  backLabel?: string;
  iconSrc?: string | null;
  slug?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  subcategoryCount?: number;
  productCount?: number;
  loading?: boolean;
}

export default function MarketplaceDetailHeader({
  title,
  backHref,
  backLabel = "Back",
  iconSrc,
  slug,
  subtitle,
  breadcrumbs = [],
  subcategoryCount,
  productCount,
  loading = false,
}: MarketplaceDetailHeaderProps) {
  const FallbackIcon = getCategoryFallbackIcon(slug, title);

  return (
    <>
      {/* Mobile: compact bar */}
      <div className="border-b border-slate-100 bg-white lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5">
          <Link
            href={backHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1a2b4c] transition hover:bg-slate-100"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-bold text-[#1a2b4c]">{title}</h1>
          <div className="h-10 w-10 shrink-0" aria-hidden />
        </div>
        <div className="border-t border-slate-50 px-4 py-4">
          {loading ? (
            <div className="flex animate-pulse items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50">
                <CatalogImage
                  src={iconSrc}
                  alt={title}
                  fallbackIcon={FallbackIcon}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-[#1a2b4c]">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: full hero banner */}
      <section className={`hidden bg-gradient-to-br ${MARKETPLACE_NAVY} lg:block`}>
        <div className="mx-auto max-w-7xl px-6 py-10 xl:px-8 xl:py-12">
          {breadcrumbs.length > 0 && (
            <div className="mb-6 lg:mb-8">
              <CatalogBreadcrumbs items={breadcrumbs} variant="light" />
            </div>
          )}

          {loading ? (
            <div className="flex animate-pulse items-center gap-6">
              <div className="h-24 w-24 rounded-2xl bg-white/20" />
              <div className="space-y-3">
                <div className="h-10 w-72 rounded-lg bg-white/20" />
                <div className="h-5 w-48 rounded bg-white/10" />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-6 xl:gap-8">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 shadow-xl backdrop-blur-sm xl:h-28 xl:w-28">
                <CatalogImage
                  src={iconSrc}
                  alt={title}
                  fallbackIcon={FallbackIcon}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-base text-blue-100/90">{subtitle}</p>
                )}
                {(subcategoryCount !== undefined || productCount !== undefined) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {subcategoryCount !== undefined && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                        <Layers className="h-4 w-4 text-blue-200" />
                        {subcategoryCount} subcategories
                      </span>
                    )}
                    {productCount !== undefined && (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                        <Package className="h-4 w-4 text-blue-200" />
                        {productCount.toLocaleString()} products
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
