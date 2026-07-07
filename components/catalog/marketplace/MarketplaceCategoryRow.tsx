"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, GitBranch, Package, ArrowUpRight } from "lucide-react";
import CatalogImage from "@/components/catalog/CatalogImage";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";
import { getMarketplaceTheme } from "@/utils/marketplaceTheme";

interface MarketplaceCategoryRowProps {
  slug: string;
  imageUrl?: string | null;
  title: string;
  productCount?: number;
  subcategoryCount?: number;
  href: string;
  index?: number;
}

export default function MarketplaceCategoryRow({
  slug,
  imageUrl,
  title,
  productCount = 0,
  subcategoryCount = 0,
  href,
  index = 0,
}: MarketplaceCategoryRowProps) {
  const theme = getMarketplaceTheme(index);
  const fallbackIcon = getCategoryFallbackIcon(slug, title);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg lg:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 ring-4 ring-slate-50 shadow-sm lg:h-20 lg:w-20">
          {imageUrl ? (
            <CatalogImage
              src={imageUrl}
              alt={title}
              fallbackIcon={fallbackIcon}
              fallbackClassName="bg-slate-200"
              className="h-full w-full object-cover"
            />
          ) : (
            React.createElement(fallbackIcon, {
              className: "h-9 w-9 text-slate-500",
              strokeWidth: 1.75,
            })
          )}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-base font-bold text-[#1a2b4c] transition group-hover:text-primary lg:text-lg">
            {title}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${theme.iconBg} ${theme.iconText}`}
            >
              <Package className="h-3.5 w-3.5" />
              {productCount.toLocaleString()} Products
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <GitBranch className="h-3.5 w-3.5" />
              {subcategoryCount} Subs
            </span>
          </div>
        </div>

        <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-300 lg:hidden" />
      </div>

      <div className="mt-4 hidden items-center justify-between border-t border-slate-100 pt-4 lg:flex">
        <span className="text-sm font-semibold text-primary">Browse subcategories</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
